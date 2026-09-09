import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LotsService {
  private readonly logger = new Logger(LotsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async createLot(userId: string, dto: CreateLotDto) {
    const lotCode = `EW-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!this.supabaseService.isConfigured()) {
      const mockLot = {
        id: '11111111-1111-1111-1111-111111111111',
        lot_code: lotCode,
        user_id: userId,
        status: 'CREATED',
        ...dto,
        created_at: new Date().toISOString(),
      };

      await this.auditService.logEvent({
        actor_id: userId,
        actor_role: 'USER',
        action: 'LOT_CREATED',
        entity_type: 'material_lots',
        entity_id: mockLot.id,
        lot_id: mockLot.id,
        new_data: mockLot,
      });

      return mockLot;
    }

    const client = this.supabaseService.getClient();
    const pointWkt = `POINT(${dto.longitude} ${dto.latitude})`;

    const { data, error } = await client
      .from('material_lots')
      .insert([
        {
          user_id: userId,
          category_id: dto.category_id,
          material_id: dto.material_id || null,
          description: dto.description || null,
          condition: dto.condition,
          estimated_weight_kg: dto.estimated_weight_kg || null,
          pickup_address: dto.pickup_address,
          pickup_pincode: dto.pickup_pincode || null,
          pickup_location: pointWkt,
          ai_estimated_min_value: dto.ai_estimated_min_value || null,
          ai_estimated_max_value: dto.ai_estimated_max_value || null,
          status: 'CREATED',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await this.auditService.logEvent({
      actor_id: userId,
      actor_role: 'USER',
      action: 'LOT_CREATED',
      entity_type: 'material_lots',
      entity_id: data.id,
      lot_id: data.id,
      new_data: data,
    });

    return data;
  }

  async getUserLots(userId: string, role: string) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          lot_code: 'EW-2026-000101',
          user_id: userId,
          status: 'AGGREGATOR_REVIEW',
          pickup_address: 'Sample Address, Mumbai',
          estimated_weight_kg: 18.5,
          created_at: new Date().toISOString(),
        },
      ];
    }

    const client = this.supabaseService.getClient();
    let query = client.from('material_lots').select('*, material_categories(name)');

    if (role === 'USER') {
      query = query.eq('user_id', userId);
    } else if (role === 'INFORMAL_AGGREGATOR') {
      query = query.or(`assigned_aggregator_id.eq.${userId},status.eq.AGGREGATOR_REVIEW`);
    } else if (role === 'COLLECTION_COLLECTOR') {
      query = query.eq('assigned_collector_id', userId);
    } else if (role === 'AUTHORIZED_RECYCLER') {
      query = query.eq('matched_recycler_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLotById(id: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        id,
        lot_code: 'EW-2026-000101',
        status: 'AGGREGATOR_REVIEW',
        estimated_weight_kg: 18.5,
        pickup_address: '402 Green Valley, Mumbai',
      };
    }

    const client = this.supabaseService.getClient();
    const isUuid = id.length === 36 && id.includes('-');
    const query = client.from('material_lots').select('*, material_categories(*), materials(*)');

    const { data, error } = isUuid
      ? await query.eq('id', id).single()
      : await query.eq('lot_code', id).single();

    if (error) throw error;
    return data;
  }
}
