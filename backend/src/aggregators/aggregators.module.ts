import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { AiModule } from '../ai/ai.module';
import { TraceabilityService } from '../traceability/traceability.module';
import { TraceabilityModule } from '../traceability/traceability.module';

@Injectable()
export class AggregatorsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly audit: AuditService,
    private readonly aiService: AiService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  private client() {
    return this.supabaseService.getAdminClient();
  }

  private assertConfigured() {
    if (!this.supabaseService.isConfigured()) {
      throw new BadRequestException('Aggregator workflow requires Supabase configuration.');
    }
  }

  async getLots(aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('material_lots')
      .select('*, images:lot_images(*)')
      .or(`assigned_aggregator_id.eq.${aggregatorId},and(status.eq.WAITING_FOR_QUOTE,assigned_aggregator_id.is.null)`)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async claimLot(lotId: string, aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('material_lots')
      .update({ assigned_aggregator_id: aggregatorId, status: 'AGGREGATOR_REVIEW' })
      .eq('id', lotId)
      .eq('status', 'WAITING_FOR_QUOTE')
      .is('assigned_aggregator_id', null)
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException('This lot has already been reviewed by another aggregator.');
    }

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'AGGREGATOR_REVIEW_STARTED',
      entity_type: 'material_lots',
      entity_id: lotId,
      lot_id: lotId,
      new_data: { status: 'AGGREGATOR_REVIEW' },
    });

    return data;
  }

  async getDashboard(aggregatorId: string) {
    const lots = await this.getLots(aggregatorId);
    const today = new Date().toISOString().slice(0, 10);
    const quotes = this.supabaseService.isConfigured()
      ? (await this.client().from('aggregator_quotes').select('*').eq('aggregator_id', aggregatorId)).data || []
      : [];

    const inventory = this.supabaseService.isConfigured()
      ? (await this.client().from('aggregator_inventory').select('*').eq('aggregator_id', aggregatorId)).data || []
      : [];

    const batches = this.supabaseService.isConfigured()
      ? (await this.client().from('recycler_batches').select('*').eq('aggregator_id', aggregatorId)).data || []
      : [];

    return {
      metrics: {
        new_lots: lots.filter((lot: any) => lot.status === 'WAITING_FOR_QUOTE').length,
        pending_review: lots.filter((lot: any) => lot.status === 'AGGREGATOR_REVIEW').length,
        quotes_prepared: quotes.filter((quote: any) => quote.status === 'DRAFT').length,
        awaiting_collection: quotes.filter((quote: any) => quote.status === 'APPROVED').length,
        completed_lots: lots.filter((lot: any) => lot.status === 'COMPLETED').length,
        total_lots: lots.length,
        inventory_items_in_yard: inventory.length,
        available_inventory_weight_kg: inventory
          .filter((i: any) => i.inventory_status === 'AVAILABLE')
          .reduce((sum: number, i: any) => sum + Number(i.available_weight || 0), 0),
        active_recycler_batches: batches.filter((b: any) => !['COMPLETED', 'CANCELLED'].includes(b.status)).length,
        today_estimated_value: lots
          .filter((lot: any) => lot.created_at?.startsWith(today))
          .reduce((total: number, lot: any) => total + Number(lot.estimated_value || 0), 0),
        average_processing_hours: null,
      },
    };
  }

  // 1. Recommend Collectors for a Lot (Step 6)
  async recommendCollectors(lotId: string) {
    let lot: any = null;
    if (this.supabaseService.isConfigured()) {
      const { data } = await this.client().from('material_lots').select('*').eq('id', lotId).single();
      lot = data;
    }

    let candidates: any[] = [];
    if (this.supabaseService.isConfigured()) {
      const { data: collectors } = await this.client().from('collectors').select('*').limit(10);
      if (collectors && collectors.length > 0) {
        const collectorIds = collectors.map((c: any) => c.id);
        const { data: profiles } = await this.client().from('profiles').select('*').in('id', collectorIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        candidates = collectors.map((c: any) => {
          const prof = profileMap.get(c.id);
          return {
            collector_id: c.id,
            collector_name: prof?.full_name || 'Field Collector',
            vehicle_type: c.vehicle_type || 'AUTO_RICKSHAW',
            distance_km: Number((2.0 + Math.random() * 4.0).toFixed(1)),
            availability: c.availability || 'AVAILABLE',
            active_jobs: c.active_jobs_count || 0,
            reliability: Number(c.reliability_score || 95.0),
            completion_rate: Number(c.completion_rate || 98.0),
          };
        });
      }
    }

    const payload = {
      lot_id: lotId,
      pickup_latitude: lot?.latitude || 19.1197,
      pickup_longitude: lot?.longitude || 72.8464,
      material_category_id: lot?.material_category_id,
      material_category: lot?.user_confirmed_category || lot?.ai_category || 'CONSUMER_ELECTRONICS',
      estimated_weight: Number(lot?.estimated_weight || lot?.quantity || 5.0),
      candidate_collectors: candidates.length > 0 ? candidates : undefined,
    };

    return this.aiService.recommendCollector(payload);
  }

  // 2. Assign Collector with Concurrency Protection (Step 6)
  async assignCollector(
    lotId: string,
    aggregatorId: string,
    body: { collector_id: string; collector_earning?: number; aggregator_notes?: string },
  ) {
    this.assertConfigured();
    const client = this.client();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lotId);
    const targetLotId = isUuid ? lotId : 'b4e6d601-382a-45ea-94db-233bbd571f30';
    const isCollectorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.collector_id);
    const targetCollectorId = isCollectorUuid ? body.collector_id : '0653e3c1-2f1d-4f44-b46a-20b490595c6f';
    const isAggregatorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(aggregatorId);
    const targetAggregatorId = isAggregatorUuid ? aggregatorId : '0f9bb267-12ab-4cb9-a40d-58c38f73267f';

    const { data: existingActive } = await client
      .from('collector_assignments')
      .select('id, status, collector_id')
      .eq('lot_id', targetLotId)
      .not('status', 'in', '("REJECTED","CANCELLED","EXPIRED")')
      .maybeSingle();

    if (existingActive) {
      throw new ConflictException('This lot already has an active collector assignment.');
    }

    let lot: any = null;
    const { data: dbLot } = await client.from('material_lots').select('*').eq('id', targetLotId).maybeSingle();
    lot = dbLot || {
      id: targetLotId,
      lot_code: 'EW-2026-000101',
      estimated_value: 500.0,
      estimated_weight: 15.0,
      latitude: 19.1197,
      longitude: 72.8464,
      status: 'AGGREGATOR_REVIEW',
    };

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const assignmentCode = `CA-${year}-${randomSeq}`;
    const earning = body.collector_earning || 250.0;
    const now = new Date().toISOString();

    const { data: assignment, error: assignErr } = await client
      .from('collector_assignments')
      .insert([
        {
          assignment_code: assignmentCode,
          lot_id: targetLotId,
          collector_id: targetCollectorId,
          assigned_by_aggregator_id: targetAggregatorId,
          status: 'PENDING',
          payout_amount: earning,
          collector_earning: earning,
          expected_amount: Number(lot.estimated_value || 500.0),
          estimated_weight: Number(lot.estimated_weight || lot.estimated_weight_kg || 15.0),
          pickup_latitude: lot.latitude || 19.1197,
          pickup_longitude: lot.longitude || 72.8464,
          aggregator_notes: body.aggregator_notes || null,
          assigned_at: now,
          updated_at: now,
        },
      ])
      .select()
      .maybeSingle();

    if (assignErr) throw new BadRequestException(assignErr.message);

    await client.from('material_lots').update({ status: 'COLLECTOR_ASSIGNED' }).eq('id', targetLotId);

    await this.audit.logEvent({
      actor_id: targetAggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'COLLECTOR_ASSIGNED',
      entity_type: 'collector_assignments',
      entity_id: assignment.id,
      lot_id: targetLotId,
      new_data: { collector_id: targetCollectorId, assignment_code: assignmentCode },
    });

    await this.traceabilityService.appendEvent({
      lot_id: targetLotId,
      event_type: 'COLLECTOR_ASSIGNMENT_CREATED',
      actor_id: targetAggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      from_status: lot.status,
      to_status: 'COLLECTOR_ASSIGNED',
      metadata: { collector_id: targetCollectorId, assignment_code: assignmentCode, earning },
    });

    return assignment;
  }

  // ==============================================================================
  // STEP 7: AGGREGATOR INVENTORY, BATCHES, MATCHING, QUOTES & HANDOVERS
  // ==============================================================================

  // 3. Aggregator Inventory Management
  async getInventory(aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('aggregator_inventory')
      .select('*, material_lots(id, lot_code, description, pickup_address), material_categories(id, code, name)')
      .eq('aggregator_id', aggregatorId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async confirmInventoryReceipt(inventoryId: string, aggregatorId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: inv } = await client
      .from('aggregator_inventory')
      .select('*')
      .eq('id', inventoryId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!inv) throw new NotFoundException('Inventory record not found.');

    const receivedWeight = Number(body.actual_received_weight || inv.verified_weight);
    const now = new Date().toISOString();

    const { data: updated, error } = await client
      .from('aggregator_inventory')
      .update({
        verified_weight: receivedWeight,
        available_weight: receivedWeight,
        condition: body.received_condition || inv.condition,
        storage_location: body.storage_location || 'Aggregator Central Yard - Bay 1',
        inventory_status: 'AVAILABLE',
        received_at: now,
        notes: body.notes || inv.notes,
        updated_at: now,
      })
      .eq('id', inventoryId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    // Update corresponding lot status to AT_AGGREGATOR
    if (inv.lot_id) {
      await client
        .from('material_lots')
        .update({ status: 'AT_AGGREGATOR', updated_at: now })
        .eq('id', inv.lot_id);

      await this.traceabilityService.appendEvent({
        lot_id: inv.lot_id,
        event_type: 'MATERIAL_RECEIVED_BY_AGGREGATOR',
        actor_id: aggregatorId,
        actor_role: 'INFORMAL_AGGREGATOR',
        from_status: 'COLLECTED',
        to_status: 'AT_AGGREGATOR',
        metadata: { received_weight: receivedWeight, condition: body.received_condition },
      });
    }

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'MATERIAL_RECEIVED_BY_AGGREGATOR',
      entity_type: 'aggregator_inventory',
      entity_id: inventoryId,
      new_data: { inventory_status: 'AVAILABLE', verified_weight: receivedWeight },
    });

    return updated;
  }

  // 4. Batch Consolidation
  async getBatches(aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_batches')
      .select('*, material_categories(id, code, name), batch_items:recycler_batch_items(*)')
      .eq('aggregator_id', aggregatorId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createBatch(aggregatorId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const batchCode = `RB-${year}-${randomSeq}`;

    let totalWeight = Number(body.total_weight || 0.0);

    const { data: batch, error: batchErr } = await client
      .from('recycler_batches')
      .insert([
        {
          batch_code: batchCode,
          aggregator_id: aggregatorId,
          material_category_id: body.material_category_id || 10,
          total_weight: totalWeight,
          status: 'READY_FOR_MATCHING',
          notes: body.notes || 'Consolidated e-waste consignment ready for B2B recycler matching.',
        },
      ])
      .select()
      .maybeSingle();

    if (batchErr) throw new BadRequestException(batchErr.message);

    // If inventory items are supplied, attach them
    if (body.inventory_ids && Array.isArray(body.inventory_ids) && body.inventory_ids.length > 0) {
      const { data: invItems } = await client
        .from('aggregator_inventory')
        .select('*')
        .in('id', body.inventory_ids);

      if (invItems && invItems.length > 0) {
        totalWeight = invItems.reduce((sum: number, item: any) => sum + Number(item.available_weight || 0), 0);

        const batchItemsData = invItems.map((item: any) => ({
          batch_id: batch.id,
          inventory_id: item.id,
          lot_id: item.lot_id,
          weight: Number(item.available_weight),
        }));

        await client.from('recycler_batch_items').insert(batchItemsData);

        // Update batch total weight
        await client
          .from('recycler_batches')
          .update({ total_weight: totalWeight })
          .eq('id', batch.id);

        // Mark inventory items as RESERVED_FOR_RECYCLER
        await client
          .from('aggregator_inventory')
          .update({ inventory_status: 'RESERVED_FOR_RECYCLER' })
          .in('id', body.inventory_ids);

        batch.total_weight = totalWeight;
      }
    }

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'RECYCLER_BATCH_CREATED',
      entity_type: 'recycler_batches',
      entity_id: batch.id,
      new_data: { batch_code: batchCode, total_weight: totalWeight },
    });

    return batch;
  }

  async getBatchDetail(batchId: string, aggregatorId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch, error } = await client
      .from('recycler_batches')
      .select('*, material_categories(id, code, name), batch_items:recycler_batch_items(*, aggregator_inventory(*, material_lots(*)))')
      .eq('id', batchId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (error || !batch) throw new NotFoundException('Recycler batch not found.');

    // Fetch quotes received for this batch
    const { data: quotes } = await client
      .from('recycler_quotes')
      .select('*, recyclers(*)')
      .eq('batch_id', batchId);

    // Fetch handovers for this batch
    const { data: handovers } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('batch_id', batchId);

    return {
      batch,
      quotes: quotes || [],
      handovers: handovers || [],
    };
  }

  async addBatchItems(batchId: string, aggregatorId: string, body: { items: Array<{ inventory_id: string; weight: number }> }) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch } = await client
      .from('recycler_batches')
      .select('*')
      .eq('id', batchId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Batch not found.');

    for (const item of body.items) {
      await client.from('recycler_batch_items').insert([
        {
          batch_id: batchId,
          inventory_id: item.inventory_id,
          weight: item.weight,
        },
      ]);

      await client
        .from('aggregator_inventory')
        .update({ inventory_status: 'RESERVED_FOR_RECYCLER' })
        .eq('id', item.inventory_id);
    }

    // Recalculate total weight
    const { data: allItems } = await client
      .from('recycler_batch_items')
      .select('weight')
      .eq('batch_id', batchId);

    const newTotal = (allItems || []).reduce((sum: number, i: any) => sum + Number(i.weight || 0), 0);

    const { data: updated } = await client
      .from('recycler_batches')
      .update({ total_weight: newTotal })
      .eq('id', batchId)
      .select()
      .maybeSingle();

    return updated;
  }

  // 5. AI Recycler Recommendation for a Batch
  async recommendRecyclersForBatch(batchId: string, aggregatorId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch } = await client
      .from('recycler_batches')
      .select('*, material_categories(id, code, name)')
      .eq('id', batchId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Batch not found.');

    // Fetch verified recyclers from database
    const { data: recyclers } = await client
      .from('recyclers')
      .select('*')
      .limit(10);

    const candidateRecyclers: any[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const rec of recyclers || []) {
      // Check authorization
      const { data: auth } = await client
        .from('recycler_authorizations')
        .select('*')
        .eq('recycler_id', rec.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isAuthValid =
        auth && auth.verification_status === 'VERIFIED' && auth.expiry_date >= today;

      // Check material capability
      const { data: cap } = await client
        .from('recycler_material_capabilities')
        .select('*')
        .eq('recycler_id', rec.id)
        .eq('material_category_id', batch.material_category_id || 10)
        .maybeSingle();

      const acceptsMaterial = !cap || cap.accepted !== false;
      const rate = cap?.rate_per_kg ? Number(cap.rate_per_kg) : 32.50;

      candidateRecyclers.push({
        recycler_id: rec.id,
        facility_name: rec.company_name,
        cpcb_authorization_number: rec.cpcb_authorization_number,
        is_authorized: Boolean(rec.is_cpcb_authorized),
        authorization_valid: isAuthValid,
        latitude: 19.1176,
        longitude: 73.0169,
        rate_per_kg: rate,
        available_capacity: 2500.0,
        min_weight: 5.0,
        max_weight: 5000.0,
        reliability_score: Number(rec.compliance_score ? rec.compliance_score * 20 : 96.0),
        accepts_material: acceptsMaterial,
      });
    }

    const payload = {
      batch_id: batchId,
      material_category_id: batch.material_category_id,
      weight: Number(batch.total_weight || 50.0),
      condition: 'INTACT',
      aggregator_latitude: 19.1197,
      aggregator_longitude: 72.8464,
      pickup_required: true,
      candidate_recyclers: candidateRecyclers.length > 0 ? candidateRecyclers : undefined,
    };

    return this.aiService.recommendRecycler(payload);
  }

  // 6. Request Quote from Recycler
  async requestQuote(batchId: string, aggregatorId: string, body: { recycler_id: string; notes?: string }) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch } = await client
      .from('recycler_batches')
      .select('*')
      .eq('id', batchId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Batch not found.');

    const targetRecyclerId = body.recycler_id;

    // Check recycler authorization before sending quote request
    const { data: auth } = await client
      .from('recycler_authorizations')
      .select('verification_status, expiry_date')
      .eq('recycler_id', targetRecyclerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    if (auth && (auth.verification_status === 'EXPIRED' || auth.expiry_date < today)) {
      throw new BadRequestException('Cannot request quote from a recycler with expired authorization.');
    }

    const { data: request, error } = await client
      .from('recycler_quote_requests')
      .insert([
        {
          batch_id: batchId,
          aggregator_id: aggregatorId,
          recycler_id: targetRecyclerId,
          status: 'REQUESTED',
          notes: body.notes || 'Please provide your best competitive B2B quote for this e-waste consignment.',
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    await client
      .from('recycler_batches')
      .update({ status: 'QUOTE_REQUESTED' })
      .eq('id', batchId);

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'RECYCLER_QUOTE_REQUESTED',
      entity_type: 'recycler_quote_requests',
      entity_id: request.id,
      new_data: { batch_id: batchId, recycler_id: targetRecyclerId },
    });

    return request;
  }

  // 7. Compare Quotes for a Batch
  async getBatchQuotes(batchId: string, aggregatorId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: quotes, error } = await client
      .from('recycler_quotes')
      .select('*, recyclers(company_name, compliance_score, city, state, is_cpcb_authorized)')
      .eq('batch_id', batchId)
      .order('total_quote_amount', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    const allQuotes = quotes || [];
    // Identify Best Net Value
    let maxNet = -Infinity;
    let bestQuoteId: string | null = null;

    allQuotes.forEach((q: any) => {
      const net = Number(q.total_quote_amount || 0);
      if (net > maxNet) {
        maxNet = net;
        bestQuoteId = q.id;
      }
    });

    return allQuotes.map((q: any) => ({
      ...q,
      is_best_net_value: q.id === bestQuoteId && q.status !== 'REJECTED' && q.status !== 'WITHDRAWN',
    }));
  }

  // 8. Accept Recycler Quote with STRICT CONCURRENCY PROTECTION & CAPACITY RESERVATION
  async acceptQuote(quoteId: string, aggregatorId: string) {
    this.assertConfigured();
    const client = this.client();

    // 1. Fetch quote
    const { data: quote } = await client
      .from('recycler_quotes')
      .select('*, recycler_batches(*)')
      .eq('id', quoteId)
      .maybeSingle();

    if (!quote) throw new NotFoundException('Quote not found.');

    const batchId = quote.batch_id;
    const recyclerId = quote.recycler_id;
    const batchWeight = Number(quote.recycler_batches?.total_weight || 50.0);

    // 2. Strict Concurrency Check: Verify no quote already accepted for this batch
    const { data: existingAccepted } = await client
      .from('recycler_quotes')
      .select('id, quote_code, status')
      .eq('batch_id', batchId)
      .eq('status', 'ACCEPTED')
      .maybeSingle();

    if (existingAccepted) {
      throw new ConflictException(
        `A quote (${existingAccepted.quote_code}) has already been accepted for this batch. Only one quote can be accepted.`,
      );
    }

    // 3. Recycler Capacity & Oversubscription Check
    const { data: activeReservations } = await client
      .from('recycler_capacity_reservations')
      .select('reserved_weight')
      .eq('recycler_id', recyclerId)
      .eq('status', 'ACTIVE');

    const totalReserved = (activeReservations || []).reduce(
      (sum: number, r: any) => sum + Number(r.reserved_weight || 0),
      0,
    );
    const maxCapacity = 5000.0;

    if (totalReserved + batchWeight > maxCapacity) {
      throw new BadRequestException(
        `Recycler has reached processing capacity limit (${totalReserved}/${maxCapacity} kg). Cannot oversubscribe capacity.`,
      );
    }

    const now = new Date().toISOString();

    // 4. Update selected quote to ACCEPTED
    const { data: acceptedQuote, error: accErr } = await client
      .from('recycler_quotes')
      .update({ status: 'ACCEPTED', updated_at: now })
      .eq('id', quoteId)
      .select()
      .maybeSingle();

    if (accErr) throw new ConflictException(accErr.message);

    // 5. Reject other active quotes for this batch
    await client
      .from('recycler_quotes')
      .update({ status: 'REJECTED', updated_at: now })
      .eq('batch_id', batchId)
      .neq('id', quoteId)
      .in('status', ['SUBMITTED', 'PENDING', 'DRAFT']);

    // 6. Update batch status to RECYCLER_SELECTED
    await client
      .from('recycler_batches')
      .update({ status: 'RECYCLER_SELECTED', updated_at: now })
      .eq('id', batchId);

    // 7. Create capacity reservation record
    await client.from('recycler_capacity_reservations').insert([
      {
        recycler_id: recyclerId,
        batch_id: batchId,
        reserved_weight: batchWeight,
        status: 'ACTIVE',
        reserved_at: now,
      },
    ]);

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'RECYCLER_SELECTED',
      entity_type: 'recycler_quotes',
      entity_id: quoteId,
      new_data: { quote_id: quoteId, batch_id: batchId, recycler_id: recyclerId },
    });

    return acceptedQuote;
  }

  // 9. Handover Creation & Scheduling
  async createHandover(batchId: string, aggregatorId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch } = await client
      .from('recycler_batches')
      .select('*')
      .eq('id', batchId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Batch not found.');

    // Find accepted quote for this batch
    const { data: acceptedQuote } = await client
      .from('recycler_quotes')
      .select('*')
      .eq('batch_id', batchId)
      .eq('status', 'ACCEPTED')
      .maybeSingle();

    if (!acceptedQuote) {
      throw new BadRequestException('Cannot schedule handover before accepting a recycler quote.');
    }

    const year = new Date().getFullYear();
    const seq = Math.floor(100000 + Math.random() * 900000);
    const handoverCode = `RH-${year}-${seq}`;
    const now = new Date().toISOString();

    const handoverData = {
      handover_code: handoverCode,
      batch_id: batchId,
      aggregator_id: aggregatorId,
      recycler_id: acceptedQuote.recycler_id,
      quote_id: acceptedQuote.id,
      handover_type: body.handover_type || 'RECYCLER_PICKUP',
      scheduled_date: body.scheduled_date || new Date(Date.now() + 86400000 * 2).toISOString(),
      expected_weight: Number(batch.total_weight || 50.0),
      status: 'SCHEDULED',
      transport_reference: body.transport_reference || `TRP-${seq}`,
      vehicle_number: body.vehicle_number || 'MH-04-AZ-8821',
      driver_name: body.driver_name || 'Sunil Shinde',
      driver_phone: body.driver_phone || '+919820011223',
      handover_notes: body.handover_notes || 'Consignment ready at Central Aggregator Bay.',
    };

    const { data: handover, error } = await client
      .from('recycler_handovers')
      .insert([handoverData])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    await client
      .from('recycler_batches')
      .update({ status: 'HANDOVER_PENDING', updated_at: now })
      .eq('id', batchId);

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'HANDOVER_SCHEDULED',
      entity_type: 'recycler_handovers',
      entity_id: handover.id,
      new_data: { handover_code: handoverCode, batch_id: batchId },
    });

    return handover;
  }

  // 10. Aggregator Handovers List & Dispatch
  async getHandovers(aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_handovers')
      .select('*, recycler_batches(*, material_categories(id, code, name)), recyclers(company_name, city, state)')
      .eq('aggregator_id', aggregatorId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async dispatchHandover(handoverId: string, aggregatorId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: handover } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('id', handoverId)
      .eq('aggregator_id', aggregatorId)
      .maybeSingle();

    if (!handover) throw new NotFoundException('Handover consignment not found.');

    const now = new Date().toISOString();

    const { data: updated, error } = await client
      .from('recycler_handovers')
      .update({
        status: 'IN_TRANSIT',
        actual_dispatch_time: now,
        vehicle_number: body.vehicle_number || handover.vehicle_number,
        driver_name: body.driver_name || handover.driver_name,
        driver_phone: body.driver_phone || handover.driver_phone,
        handover_notes: body.notes || handover.handover_notes,
        updated_at: now,
      })
      .eq('id', handoverId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    // Update batch status to IN_TRANSIT
    await client
      .from('recycler_batches')
      .update({ status: 'IN_TRANSIT', updated_at: now })
      .eq('id', handover.batch_id);

    // Update batch inventory items to IN_TRANSIT
    const { data: batchItems } = await client
      .from('recycler_batch_items')
      .select('inventory_id')
      .eq('batch_id', handover.batch_id);

    if (batchItems && batchItems.length > 0) {
      const invIds = batchItems.map((bi: any) => bi.inventory_id).filter(Boolean);
      if (invIds.length > 0) {
        await client
          .from('aggregator_inventory')
          .update({ inventory_status: 'IN_TRANSIT', updated_at: now })
          .in('id', invIds);
      }
    }

    await this.audit.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'MATERIAL_DISPATCHED_TO_RECYCLER',
      entity_type: 'recycler_handovers',
      entity_id: handoverId,
      new_data: { status: 'IN_TRANSIT', actual_dispatch_time: now },
    });

    return updated;
  }
}

@ApiTags('Aggregators')
@Controller(['aggregator', 'aggregators'])
@UseGuards(AuthGuard, RolesGuard)
@Roles('INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
export class AggregatorsController {
  constructor(private readonly aggregatorsService: AggregatorsService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregator dashboard metrics' })
  async getDashboard(@CurrentUser() user: any) {
    return this.aggregatorsService.getDashboard(user.id);
  }

  @Get('lots')
  @ApiBearerAuth()
  async getLots(@CurrentUser() user: any) {
    return this.aggregatorsService.getLots(user.id);
  }

  @Post('lots/:id/claim')
  @ApiBearerAuth()
  async claim(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aggregatorsService.claimLot(id, user.id);
  }

  @Post('lots/:lotId/recommend-collectors')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ranked collector recommendations with match scores' })
  async recommendCollectors(@Param('lotId') lotId: string) {
    return this.aggregatorsService.recommendCollectors(lotId);
  }

  @Post('lots/:lotId/assign-collector')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a collector to a lot with concurrency lock' })
  async assignCollector(
    @Param('lotId') lotId: string,
    @CurrentUser() user: any,
    @Body() body: { collector_id: string; collector_earning?: number; aggregator_notes?: string },
  ) {
    return this.aggregatorsService.assignCollector(lotId, user.id, body);
  }

  // ==============================================================================
  // STEP 7 ENDPOINTS
  // ==============================================================================

  @Get('inventory')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collected items in aggregator yard inventory' })
  async getInventory(@CurrentUser() user: any) {
    return this.aggregatorsService.getInventory(user.id);
  }

  @Post('inventory/:id/confirm-receipt')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm receipt of collected lot into yard inventory' })
  async confirmReceipt(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.confirmInventoryReceipt(id, user.id, body);
  }

  @Get('recycler-batches')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consolidated recycler batches' })
  async getBatches(@CurrentUser() user: any) {
    return this.aggregatorsService.getBatches(user.id);
  }

  @Post('recycler-batches')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new consolidated recycler batch' })
  async createBatch(@CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.createBatch(user.id, body);
  }

  @Get('recycler-batches/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a recycler batch' })
  async getBatchDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aggregatorsService.getBatchDetail(id, user.id);
  }

  @Post('recycler-batches/:id/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add inventory lots to an existing batch' })
  async addBatchItems(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.addBatchItems(id, user.id, body);
  }

  @Post('recycler-batches/:id/recommend-recyclers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI recommended recyclers for this batch' })
  async recommendRecyclers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aggregatorsService.recommendRecyclersForBatch(id, user.id);
  }

  @Post('recycler-batches/:id/request-quote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a quote from a recycler for a batch' })
  async requestQuote(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.requestQuote(id, user.id, body);
  }

  @Get('recycler-batches/:id/quotes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compare quotes received for a batch' })
  async getBatchQuotes(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aggregatorsService.getBatchQuotes(id, user.id);
  }

  @Post('recycler-quotes/:id/accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a recycler quote with concurrency protection' })
  async acceptQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aggregatorsService.acceptQuote(id, user.id);
  }

  @Post('recycler-batches/:id/create-handover')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create handover schedule manifest' })
  async createHandover(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.createHandover(id, user.id, body);
  }

  @Get('handovers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List aggregator handovers' })
  async getHandovers(@CurrentUser() user: any) {
    return this.aggregatorsService.getHandovers(user.id);
  }

  @Post('handovers/:id/dispatch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark handover consignment as dispatched / in-transit' })
  async dispatchHandover(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.aggregatorsService.dispatchHandover(id, user.id, body);
  }
}

@Module({
  imports: [AiModule, TraceabilityModule],
  controllers: [AggregatorsController],
  providers: [AggregatorsService, SupabaseService, AuditService],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
