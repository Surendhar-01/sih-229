import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { TraceabilityService } from '../traceability/traceability.module';
import { AiService } from '../ai/ai.service';
import { AiModule } from '../ai/ai.module';
import { TraceabilityModule } from '../traceability/traceability.module';

@Injectable()
export class RecyclersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly audit: AuditService,
    private readonly traceabilityService: TraceabilityService,
    private readonly aiService: AiService,
  ) {}

  private client() {
    return this.supabaseService.getAdminClient();
  }

  private assertConfigured() {
    if (!this.supabaseService.isConfigured()) {
      throw new BadRequestException('Recycler module requires active Supabase configuration.');
    }
  }

  // 1. Get Recycler Profile & Authorization
  async getProfile(recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: profile } = await client
      .from('profiles')
      .select('id, email, phone, full_name, role, account_status, general_location, preferred_language, created_at')
      .eq('id', recyclerId)
      .maybeSingle();

    const { data: recycler } = await client
      .from('recyclers')
      .select('*')
      .eq('id', recyclerId)
      .maybeSingle();

    // Check authorization status & validity
    const authStatus = await this.getAuthorizationStatus(recyclerId);

    return {
      profile: profile || {},
      facility: recycler || {
        company_name: profile?.full_name || 'EcoClean E-Waste Recyclers Pvt Ltd',
        facility_address: 'Plot 42, TTC Industrial Area, MIDC Mahape, Navi Mumbai',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '400710',
        annual_capacity_metric_tons: 12000.0,
        compliance_score: 4.92,
        is_cpcb_authorized: true,
      },
      authorization: authStatus,
    };
  }

  // 2. Update Profile (restricted fields)
  async updateProfile(recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    // Prevent direct edits to system/government controlled fields
    const disallowed = [
      'verification_status',
      'authorization_status',
      'is_cpcb_authorized',
      'compliance_score',
      'reliability_score',
      'cpcb_authorization_number',
    ];
    for (const key of disallowed) {
      if (key in body) {
        delete body[key];
      }
    }

    // Update facility profile in recyclers table
    const { data: updated, error } = await client
      .from('recyclers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recyclerId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'RECYCLER_PROFILE_UPDATED',
      entity_type: 'recyclers',
      entity_id: recyclerId,
      new_data: body,
    });

    return updated;
  }

  // 3. Authorization status with Server-Side Expiry Check
  async getAuthorizationStatus(recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: authRecord } = await client
      .from('recycler_authorizations')
      .select('*')
      .eq('recycler_id', recyclerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    let status = authRecord?.verification_status || 'VERIFIED';
    let isExpired = false;
    let daysUntilExpiry = 999;

    if (authRecord?.expiry_date) {
      const exp = new Date(authRecord.expiry_date);
      const now = new Date();
      const diffMs = exp.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (authRecord.expiry_date < today) {
        isExpired = true;
        status = 'EXPIRED';
        // Auto-update server-side to EXPIRED if date passed
        if (authRecord.verification_status !== 'EXPIRED') {
          await client
            .from('recycler_authorizations')
            .update({ verification_status: 'EXPIRED', updated_at: new Date().toISOString() })
            .eq('id', authRecord.id);

          await client
            .from('recyclers')
            .update({ is_cpcb_authorized: false, updated_at: new Date().toISOString() })
            .eq('id', recyclerId);
        }
      }
    }

    return {
      authorization_id: authRecord?.id || null,
      authorization_number: authRecord?.authorization_number || 'CPCB/EW-REG/MH-2023/401',
      issuing_authority: authRecord?.issuing_authority || 'Central Pollution Control Board (CPCB)',
      issued_date: authRecord?.issued_date || '2023-01-01',
      expiry_date: authRecord?.expiry_date || '2028-12-31',
      verification_status: status,
      is_expired: isExpired,
      days_until_expiry: daysUntilExpiry,
      warning: daysUntilExpiry <= 30 && !isExpired ? 'Authorization expires in less than 30 days.' : null,
    };
  }

  // 4. Recycler Material Capabilities
  async getCapabilities(recyclerId: string) {
    this.assertConfigured();
    const { data } = await this.client()
      .from('recycler_material_capabilities')
      .select('*, material_categories(id, code, name), materials(id, code, name)')
      .eq('recycler_id', recyclerId);
    return data || [];
  }

  async addCapability(recyclerId: string, body: any) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_material_capabilities')
      .insert([{ ...body, recycler_id: recyclerId }])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCapability(capabilityId: string, recyclerId: string, body: any) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_material_capabilities')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', capabilityId)
      .eq('recycler_id', recyclerId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteCapability(capabilityId: string, recyclerId: string) {
    this.assertConfigured();
    await this.client()
      .from('recycler_material_capabilities')
      .delete()
      .eq('id', capabilityId)
      .eq('recycler_id', recyclerId);
    return { success: true };
  }

  // 5. Dashboard Metrics
  async getDashboard(recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const auth = await this.getAuthorizationStatus(recyclerId);

    // Incoming handovers
    const { data: handovers } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('recycler_id', recyclerId);

    const allHandovers = handovers || [];
    const incomingHandovers = allHandovers.filter((h: any) =>
      ['SCHEDULED', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED', 'UNDER_VERIFICATION'].includes(h.status),
    );
    const completedHandovers = allHandovers.filter((h: any) => h.status === 'RECEIVED');

    // Quotes
    const { data: quotes } = await client
      .from('recycler_quotes')
      .select('*')
      .eq('recycler_id', recyclerId);

    const allQuotes = quotes || [];
    const pendingQuotes = allQuotes.filter((q: any) => q.status === 'DRAFT' || q.status === 'PENDING');
    const submittedQuotes = allQuotes.filter((q: any) => q.status === 'SUBMITTED');
    const acceptedQuotes = allQuotes.filter((q: any) => q.status === 'ACCEPTED');

    // Weight calculations
    const today = new Date().toISOString().slice(0, 10);
    const todayReceived = completedHandovers
      .filter((h: any) => h.actual_arrival_time?.startsWith(today) || h.updated_at?.startsWith(today))
      .reduce((sum: number, h: any) => sum + Number(h.received_weight || h.expected_weight || 0), 0);

    const totalWeightKg = completedHandovers.reduce(
      (sum: number, h: any) => sum + Number(h.received_weight || h.expected_weight || 0),
      0,
    );

    // Opportunities count
    const { data: batches } = await client
      .from('recycler_batches')
      .select('id, status')
      .in('status', ['READY_FOR_MATCHING', 'QUOTE_REQUESTED']);

    // Capacity calculations
    const { data: activeReservations } = await client
      .from('recycler_capacity_reservations')
      .select('reserved_weight')
      .eq('recycler_id', recyclerId)
      .eq('status', 'ACTIVE');

    const reservedWeight = (activeReservations || []).reduce(
      (sum: number, r: any) => sum + Number(r.reserved_weight || 0),
      0,
    );
    const totalDailyCapacity = 5000.0;
    const availableCapacity = Math.max(0, totalDailyCapacity - reservedWeight);

    return {
      metrics: {
        new_opportunities: auth.is_expired ? 0 : (batches || []).length,
        pending_quotes: pendingQuotes.length,
        submitted_quotes: submittedQuotes.length,
        accepted_quotes: acceptedQuotes.length,
        incoming_handovers: incomingHandovers.length,
        materials_received_today_kg: Number(todayReceived.toFixed(2)),
        total_received_weight_kg: Number(totalWeightKg.toFixed(2)),
        total_processing_capacity_kg: totalDailyCapacity,
        available_capacity_kg: Number(availableCapacity.toFixed(2)),
        capacity_utilization_pct: Number(((reservedWeight / totalDailyCapacity) * 100).toFixed(1)),
        completed_handovers: completedHandovers.length,
        disputed_handovers: allHandovers.filter((h: any) => h.status === 'DISPUTED').length,
        estimated_pending_receivable_inr: acceptedQuotes.reduce(
          (sum: number, q: any) => sum + Number(q.total_quote_amount || 0),
          0,
        ),
      },
      authorization: auth,
      recent_handovers: incomingHandovers.slice(0, 5),
    };
  }

  // 6. Recycler Opportunities (Aggregator batches matching capabilities)
  async getOpportunities(recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const auth = await this.getAuthorizationStatus(recyclerId);
    if (auth.is_expired) {
      return []; // Expired authorization blocks new opportunities
    }

    // Fetch batches in matching or quote requested states
    const { data: batches, error } = await client
      .from('recycler_batches')
      .select('*, material_categories(id, code, name), batch_items:recycler_batch_items(*)')
      .in('status', ['READY_FOR_MATCHING', 'QUOTE_REQUESTED'])
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    // Fetch capabilities
    const { data: caps } = await client
      .from('recycler_material_capabilities')
      .select('material_category_id, accepted, rate_per_kg')
      .eq('recycler_id', recyclerId)
      .eq('accepted', true);

    const acceptedCatIds = new Set((caps || []).map((c: any) => c.material_category_id));

    // Filter to compatible batches
    const opportunities = (batches || [])
      .filter((b: any) => !b.material_category_id || acceptedCatIds.has(b.material_category_id))
      .map((b: any) => ({
        batch_id: b.id,
        batch_code: b.batch_code,
        material_category_id: b.material_category_id,
        material_category_name: b.material_categories?.name || 'Mixed Consumer E-Waste',
        total_weight_kg: Number(b.total_weight || 50.0),
        status: b.status,
        approximate_location: 'Mumbai Suburban District, Maharashtra',
        pickup_required: true,
        reference_market_rate_per_kg: 28.0,
        estimated_gross_value: Number((b.total_weight * 28.0).toFixed(2)),
        created_at: b.created_at,
      }));

    return opportunities;
  }

  async getOpportunityDetail(batchId: string, recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: batch } = await client
      .from('recycler_batches')
      .select('*, material_categories(id, code, name), batch_items:recycler_batch_items(*)')
      .eq('id', batchId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Batch opportunity not found.');

    // Fetch any quote already submitted by this recycler for this batch
    const { data: existingQuote } = await client
      .from('recycler_quotes')
      .select('*')
      .eq('batch_id', batchId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    return {
      batch,
      existing_quote: existingQuote || null,
    };
  }

  // 7. Recycler Quotes Management
  async getQuotes(recyclerId: string, status?: string) {
    this.assertConfigured();
    let query = this.client()
      .from('recycler_quotes')
      .select('*, recycler_batches(*, material_categories(id, code, name))')
      .eq('recycler_id', recyclerId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getQuoteDetail(quoteId: string, recyclerId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_quotes')
      .select('*, recycler_batches(*, material_categories(id, code, name))')
      .eq('id', quoteId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Quote not found.');
    return data;
  }

  // Create or Submit Quote with Itemized Breakdown
  async createQuote(recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    // Check authorization validity
    const auth = await this.getAuthorizationStatus(recyclerId);
    if (auth.is_expired) {
      throw new ForbiddenException('Cannot create quotes with expired CPCB authorization.');
    }

    const batchId = body.batch_id;
    const { data: batch } = await client
      .from('recycler_batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle();

    if (!batch) throw new NotFoundException('Target batch not found.');

    // Compute transparent price breakdown
    const weight = Number(batch.total_weight || body.weight || 50.0);
    const rate = Number(body.rate_per_kg || 28.0);
    const baseAmount = Number((weight * rate).toFixed(2));
    const pickupCost = Number(body.pickup_cost || 150.0);
    const transportCost = Number(body.transport_cost || 250.0);
    const handlingAdj = Number(body.handling_adjustment || 0.0);
    const taxAmount = Number(body.tax_amount || (baseAmount * 0.05).toFixed(2)); // 5% GST example
    const otherAdj = Number(body.other_adjustment || 0.0);

    // Total quote amount = Base - Logistics + Tax + Adjustments
    const totalQuote = Number(
      (baseAmount - pickupCost - transportCost + handlingAdj + taxAmount + otherAdj).toFixed(2),
    );

    const year = new Date().getFullYear();
    const seq = Math.floor(100000 + Math.random() * 900000);
    const quoteCode = `RQ-${year}-${seq}`;

    const quoteData = {
      quote_code: quoteCode,
      batch_id: batchId,
      aggregator_id: batch.aggregator_id,
      recycler_id: recyclerId,
      rate_per_kg: rate,
      offered_rate_per_kg: rate,
      base_amount: baseAmount,
      pickup_cost: pickupCost,
      transport_cost: transportCost,
      handling_adjustment: handlingAdj,
      tax_amount: taxAmount,
      other_adjustment: otherAdj,
      total_quote_amount: totalQuote,
      total_quote_value: totalQuote,
      currency: 'INR',
      pickup_supported: body.pickup_supported !== undefined ? body.pickup_supported : true,
      proposed_pickup_date: body.proposed_pickup_date || new Date(Date.now() + 86400000 * 2).toISOString(),
      valid_until: body.valid_until || new Date(Date.now() + 86400000 * 4).toISOString(),
      notes: body.notes || 'Includes calibrated digital scale inspection and CPCB compliant recycling.',
      status: body.submit_immediately ? 'SUBMITTED' : 'DRAFT',
    };

    const { data: quote, error } = await client
      .from('recycler_quotes')
      .insert([quoteData])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (quoteData.status === 'SUBMITTED') {
      await this.audit.logEvent({
        actor_id: recyclerId,
        actor_role: 'AUTHORIZED_RECYCLER',
        action: 'RECYCLER_QUOTE_SUBMITTED',
        entity_type: 'recycler_quotes',
        entity_id: quote.id,
        new_data: { quote_code: quoteCode, total_quote_amount: totalQuote },
      });
    }

    return quote;
  }

  async submitQuote(quoteId: string, recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: quote } = await client
      .from('recycler_quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!quote) throw new NotFoundException('Quote not found.');
    if (quote.status === 'ACCEPTED') throw new ConflictException('Cannot re-submit an accepted quote.');

    const { data: updated } = await client
      .from('recycler_quotes')
      .update({ status: 'SUBMITTED', updated_at: new Date().toISOString() })
      .eq('id', quoteId)
      .select()
      .maybeSingle();

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'RECYCLER_QUOTE_SUBMITTED',
      entity_type: 'recycler_quotes',
      entity_id: quoteId,
      new_data: { status: 'SUBMITTED' },
    });

    return updated;
  }

  async withdrawQuote(quoteId: string, recyclerId: string) {
    this.assertConfigured();
    const client = this.client();

    const { data: quote } = await client
      .from('recycler_quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!quote) throw new NotFoundException('Quote not found.');
    if (quote.status === 'ACCEPTED') throw new ConflictException('Cannot withdraw an accepted quote.');

    const { data: updated } = await client
      .from('recycler_quotes')
      .update({ status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', quoteId)
      .select()
      .maybeSingle();

    return updated;
  }

  // 8. Recycler Handovers & Field Receiving Screen
  async getHandovers(recyclerId: string, status?: string) {
    this.assertConfigured();
    let query = this.client()
      .from('recycler_handovers')
      .select('*, recycler_batches(*, material_categories(id, code, name)), recycler_quotes(quote_code, rate_per_kg, total_quote_amount)')
      .eq('recycler_id', recyclerId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getHandoverDetail(handoverId: string, recyclerId: string) {
    this.assertConfigured();
    const { data, error } = await this.client()
      .from('recycler_handovers')
      .select('*, recycler_batches(*, material_categories(id, code, name), batch_items:recycler_batch_items(*)), recycler_quotes(*)')
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Handover consignment not found.');
    return data;
  }

  // Recycler marks consignment arrival
  async markArrived(handoverId: string, recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();
    const now = new Date().toISOString();

    const { data: handover } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!handover) throw new NotFoundException('Handover consignment not found.');

    const { data: updated } = await client
      .from('recycler_handovers')
      .update({
        status: 'ARRIVED',
        actual_arrival_time: now,
        recycler_notes: body.notes || 'Consignment arrived at facility gate.',
        updated_at: now,
      })
      .eq('id', handoverId)
      .select()
      .maybeSingle();

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'MATERIAL_ARRIVED_AT_RECYCLER',
      entity_type: 'recycler_handovers',
      entity_id: handoverId,
      new_data: { status: 'ARRIVED', arrival_time: now },
    });

    return updated;
  }

  // Start physical verification
  async startVerification(handoverId: string, recyclerId: string) {
    this.assertConfigured();
    const client = this.client();
    const now = new Date().toISOString();

    const { data: updated } = await client
      .from('recycler_handovers')
      .update({
        status: 'UNDER_VERIFICATION',
        updated_at: now,
      })
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .select()
      .maybeSingle();

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'RECYCLER_VERIFICATION_STARTED',
      entity_type: 'recycler_handovers',
      entity_id: handoverId,
      new_data: { status: 'UNDER_VERIFICATION' },
    });

    return updated;
  }

  // Record physical weight and material verification with discrepancy calculation
  async verifyMaterialAndWeight(handoverId: string, recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: handover } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!handover) throw new NotFoundException('Handover not found.');

    const expectedWeight = Number(handover.expected_weight || 50.0);
    const receivedWeight = Number(body.received_weight || expectedWeight);
    const acceptedWeight = Number(body.accepted_weight !== undefined ? body.accepted_weight : receivedWeight);
    const rejectedWeight = Number(body.rejected_weight || Math.max(0, receivedWeight - acceptedWeight));

    // Discrepancy % = ABS(received - expected) / expected * 100
    const diff = Math.abs(receivedWeight - expectedWeight);
    const discrepancyPct = Number(((diff / Math.max(expectedWeight, 0.1)) * 100).toFixed(2));

    const decision = body.quality_decision || (rejectedWeight > 0 ? 'PARTIALLY_ACCEPTED' : 'ACCEPTED');
    const now = new Date().toISOString();

    const { data: updated } = await client
      .from('recycler_handovers')
      .update({
        received_weight: receivedWeight,
        accepted_weight: acceptedWeight,
        rejected_weight: rejectedWeight,
        discrepancy_percentage: discrepancyPct,
        quality_decision: decision,
        rejection_reason: body.rejection_reason || null,
        recycler_notes: body.notes || handover.recycler_notes,
        proof_documents: body.proof_documents || handover.proof_documents,
        updated_at: now,
      })
      .eq('id', handoverId)
      .select()
      .maybeSingle();

    // Check discrepancy threshold (> 5%)
    const thresholdPct = 5.0;
    if (discrepancyPct > thresholdPct) {
      await client.from('anomaly_alerts').insert([
        {
          entity_type: 'recycler_handovers',
          entity_id: handoverId,
          alert_type: 'HIGH_WEIGHT_DISCREPANCY',
          severity: discrepancyPct > 15.0 ? 'CRITICAL' : 'HIGH',
          description: `Consignment ${handover.handover_code} weight discrepancy is ${discrepancyPct}% (Expected: ${expectedWeight} kg, Received: ${receivedWeight} kg).`,
          metadata: {
            handover_code: handover.handover_code,
            expected_weight: expectedWeight,
            received_weight: receivedWeight,
            discrepancy_percentage: discrepancyPct,
            recycler_id: recyclerId,
          },
        },
      ]);
    }

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'RECYCLER_WEIGHT_VERIFIED',
      entity_type: 'recycler_handovers',
      entity_id: handoverId,
      new_data: { received_weight: receivedWeight, accepted_weight: acceptedWeight, discrepancy_percentage: discrepancyPct },
    });

    return updated;
  }

  // Final Confirmation of Handover
  async confirmHandover(handoverId: string, recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: handover } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!handover) throw new NotFoundException('Handover not found.');

    const now = new Date().toISOString();
    const receivedWeight = Number(body.received_weight || handover.received_weight || handover.expected_weight);
    const acceptedWeight = Number(body.accepted_weight || handover.accepted_weight || receivedWeight);
    const rejectedWeight = Number(body.rejected_weight || handover.rejected_weight || 0.0);

    // 1. Update handover status to RECEIVED
    const { data: updatedHandover } = await client
      .from('recycler_handovers')
      .update({
        status: 'RECEIVED',
        received_weight: receivedWeight,
        accepted_weight: acceptedWeight,
        rejected_weight: rejectedWeight,
        proof_documents: body.proof_documents || handover.proof_documents,
        updated_at: now,
      })
      .eq('id', handoverId)
      .select()
      .maybeSingle();

    // 2. Update batch status to RECEIVED
    await client
      .from('recycler_batches')
      .update({ status: 'RECEIVED', updated_at: now })
      .eq('id', handover.batch_id);

    // 3. Update aggregator inventory status to HANDED_OVER
    const { data: batchItems } = await client
      .from('recycler_batch_items')
      .select('inventory_id, lot_id')
      .eq('batch_id', handover.batch_id);

    if (batchItems && batchItems.length > 0) {
      const invIds = batchItems.map((bi: any) => bi.inventory_id).filter(Boolean);
      if (invIds.length > 0) {
        await client
          .from('aggregator_inventory')
          .update({ inventory_status: 'HANDED_OVER', updated_at: now })
          .in('id', invIds);
      }

      // Update material_lots status to HANDOVER_COMPLETED or AT_RECYCLER
      const lotIds = batchItems.map((bi: any) => bi.lot_id).filter(Boolean);
      if (lotIds.length > 0) {
        await client
          .from('material_lots')
          .update({
            status: 'AT_RECYCLER',
            matched_recycler_id: recyclerId,
            updated_at: now,
          })
          .in('id', lotIds);
      }
    }

    // 4. Update capacity reservation to USED
    await client
      .from('recycler_capacity_reservations')
      .update({ status: 'USED', released_at: now })
      .eq('batch_id', handover.batch_id)
      .eq('recycler_id', recyclerId);

    // 5. Append immutable audit event
    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'HANDOVER_COMPLETED',
      entity_type: 'recycler_handovers',
      entity_id: handoverId,
      new_data: { status: 'RECEIVED', received_weight: receivedWeight },
    });

    return updatedHandover;
  }

  // Raise formal dispute
  async raiseDispute(handoverId: string, recyclerId: string, body: any) {
    this.assertConfigured();
    const client = this.client();

    const { data: handover } = await client
      .from('recycler_handovers')
      .select('*')
      .eq('id', handoverId)
      .eq('recycler_id', recyclerId)
      .maybeSingle();

    if (!handover) throw new NotFoundException('Handover not found.');

    const disputeData = {
      handover_id: handoverId,
      batch_id: handover.batch_id,
      raised_by: recyclerId,
      reason: body.reason || 'WEIGHT_DIFFERENCE',
      description: body.description || 'Significant physical variance or contamination found during inspection.',
      expected_weight: Number(handover.expected_weight),
      actual_weight: Number(body.actual_weight || handover.received_weight || 0),
      disputed_weight: Number(body.disputed_weight || Math.abs(Number(handover.expected_weight) - Number(body.actual_weight || 0))),
      evidence_paths: body.evidence_paths || [],
      status: 'OPEN',
    };

    const { data: dispute, error } = await client
      .from('handover_disputes')
      .insert([disputeData])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    // Update handover status to DISPUTED
    await client
      .from('recycler_handovers')
      .update({ status: 'DISPUTED', updated_at: new Date().toISOString() })
      .eq('id', handoverId);

    await this.audit.logEvent({
      actor_id: recyclerId,
      actor_role: 'AUTHORIZED_RECYCLER',
      action: 'HANDOVER_DISPUTE_RAISED',
      entity_type: 'handover_disputes',
      entity_id: dispute.id,
      new_data: disputeData,
    });

    return dispute;
  }
}

@ApiTags('Recyclers')
@Controller(['recycler', 'recyclers'])
@UseGuards(AuthGuard, RolesGuard)
@Roles('AUTHORIZED_RECYCLER', 'GOVERNMENT_ADMIN')
export class RecyclersController {
  constructor(private readonly recyclersService: RecyclersService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recycler dashboard KPIs and capacity overview' })
  async getDashboard(@CurrentUser() user: any) {
    return this.recyclersService.getDashboard(user.id);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recycler facility profile and authorization' })
  async getProfile(@CurrentUser() user: any) {
    return this.recyclersService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update editable recycler profile details' })
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.updateProfile(user.id, body);
  }

  @Get('authorization')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get regulatory authorization status and expiry warning' })
  async getAuthorization(@CurrentUser() user: any) {
    return this.recyclersService.getAuthorizationStatus(user.id);
  }

  @Get('capabilities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get accepted material capabilities and pricing' })
  async getCapabilities(@CurrentUser() user: any) {
    return this.recyclersService.getCapabilities(user.id);
  }

  @Post('capabilities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new material capability' })
  async addCapability(@CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.addCapability(user.id, body);
  }

  @Patch('capabilities/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update material capability rate or settings' })
  async updateCapability(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.updateCapability(id, user.id, body);
  }

  @Delete('capabilities/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a material capability' })
  async deleteCapability(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.deleteCapability(id, user.id);
  }

  @Get('opportunities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available aggregator batches matching capabilities' })
  async getOpportunities(@CurrentUser() user: any) {
    return this.recyclersService.getOpportunities(user.id);
  }

  @Get('opportunities/:batchId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a batch opportunity' })
  async getOpportunityDetail(@Param('batchId') batchId: string, @CurrentUser() user: any) {
    return this.recyclersService.getOpportunityDetail(batchId, user.id);
  }

  @Get('quotes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List quotes submitted by this recycler' })
  async getQuotes(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.recyclersService.getQuotes(user.id, status);
  }

  @Get('quotes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote details' })
  async getQuoteDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.getQuoteDetail(id, user.id);
  }

  @Post('quotes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or submit a new recycler quote' })
  async createQuote(@CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.createQuote(user.id, body);
  }

  @Post('quotes/:id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a draft quote to aggregator' })
  async submitQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.submitQuote(id, user.id);
  }

  @Post('quotes/:id/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a quote before aggregator accepts' })
  async withdrawQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.withdrawQuote(id, user.id);
  }

  @Get('handovers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List incoming and past handovers' })
  async getHandovers(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.recyclersService.getHandovers(user.id, status);
  }

  @Get('handovers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get handover consignment details' })
  async getHandoverDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.getHandoverDetail(id, user.id);
  }

  @Post('handovers/:id/arrive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark consignment arrival at facility gate' })
  async markArrived(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.markArrived(id, user.id, body);
  }

  @Post('handovers/:id/start-verification')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start physical inspection and weighing' })
  async startVerification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recyclersService.startVerification(id, user.id);
  }

  @Post('handovers/:id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record verified weight and material grade' })
  async verifyMaterialAndWeight(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.verifyMaterialAndWeight(id, user.id, body);
  }

  @Post('handovers/:id/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm receipt and complete handover' })
  async confirmHandover(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.confirmHandover(id, user.id, body);
  }

  @Post('handovers/:id/dispute')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Raise formal dispute on weight/material difference' })
  async raiseDispute(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.recyclersService.raiseDispute(id, user.id, body);
  }
}

@Module({
  imports: [AiModule, TraceabilityModule],
  controllers: [RecyclersController],
  providers: [RecyclersService, SupabaseService, AuditService],
  exports: [RecyclersService],
})
export class RecyclersModule {}
