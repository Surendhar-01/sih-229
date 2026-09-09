import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';

export interface LotRecord {
  id: string;
  lot_code: string;
  user_id: string;
  user_name?: string;
  category_id: number;
  category_name?: string;
  material_id?: number;
  description?: string;
  condition: string;
  estimated_weight_kg: number;
  verified_weight_kg?: number;
  pickup_address: string;
  pickup_pincode?: string;
  pickup_location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  ai_estimated_min_value: number;
  ai_estimated_max_value: number;
  agreed_purchase_price?: number;
  final_recycler_price?: number;
  assigned_aggregator_id?: string;
  assigned_collector_id?: string;
  assigned_collector_name?: string;
  matched_recycler_id?: string;
  pickup_otp: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class LotsService {
  private readonly logger = new Logger(LotsService.name);

  // In-memory persistent store for rich local development & demo without requiring remote DB write latency
  private inMemoryLots: LotRecord[] = [
    {
      id: 'lot-001',
      lot_code: 'EW-2026-000101',
      user_id: 'usr-user-001',
      user_name: 'Anita Sharma (Household Citizen)',
      category_id: 1,
      category_name: 'CRT Monitors & TVs',
      description: 'Old 21" Sony Trinitron CRT television, intact casing with power cord',
      condition: 'INTACT',
      estimated_weight_kg: 18.5,
      verified_weight_kg: undefined,
      pickup_address: 'Flat 402, Green Valley Apartments, Andheri West, Mumbai',
      pickup_pincode: '400053',
      latitude: 19.1363,
      longitude: 72.8277,
      status: 'COLLECTOR_ASSIGNED',
      ai_estimated_min_value: 350.0,
      ai_estimated_max_value: 480.0,
      agreed_purchase_price: 420.0,
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      assigned_collector_id: 'usr-collection_collector-001',
      assigned_collector_name: 'Ramesh Babu (Runner #04)',
      pickup_otp: '4821',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'lot-002',
      lot_code: 'EW-2026-000102',
      user_id: 'usr-user-002',
      user_name: 'Vikram Patel (Small Office)',
      category_id: 3,
      category_name: 'Printed Circuit Boards (PCB)',
      description: 'Box of mixed desktop motherboards and server RAM modules',
      condition: 'PARTIAL_DISASSEMBLED',
      estimated_weight_kg: 8.2,
      verified_weight_kg: undefined,
      pickup_address: 'Gala 14, Lotus Commercial Complex, Malad West, Mumbai',
      pickup_pincode: '400064',
      latitude: 19.1860,
      longitude: 72.8485,
      status: 'AGGREGATOR_REVIEW',
      ai_estimated_min_value: 3200.0,
      ai_estimated_max_value: 3900.0,
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      pickup_otp: '7392',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'lot-003',
      lot_code: 'EW-2026-000103',
      user_id: 'usr-user-003',
      user_name: 'TechCorp Services',
      category_id: 4,
      category_name: 'Batteries (Lithium-Ion)',
      description: 'Swollen laptop battery packs and UPS backup units',
      condition: 'DAMAGED_CRUSHED',
      estimated_weight_kg: 12.0,
      verified_weight_kg: 12.2,
      pickup_address: 'Building 3, Mindspace SEZ, Airoli, Navi Mumbai',
      pickup_pincode: '400708',
      latitude: 19.1550,
      longitude: 72.9980,
      status: 'AT_AGGREGATOR',
      ai_estimated_min_value: 540.0,
      ai_estimated_max_value: 660.0,
      agreed_purchase_price: 600.0,
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      assigned_collector_id: 'usr-collection_collector-001',
      matched_recycler_id: 'usr-authorized_recycler-001',
      pickup_otp: '1945',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
  ];

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
    private readonly aiService: AiService,
  ) {}

  async scanImageWithAi(imageData: { image_base64?: string; user_hints?: string }) {
    const aiResult = await this.aiService.classifyMaterial(imageData);
    return aiResult;
  }

  async createLot(userId: string, dto: CreateLotDto, userName = 'Citizen User') {
    const lotCode = `EW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newLot: LotRecord = {
      id: `lot-${Date.now()}`,
      lot_code: lotCode,
      user_id: userId,
      user_name: userName,
      category_id: dto.category_id,
      category_name: this.getCategoryName(dto.category_id),
      material_id: dto.material_id,
      description: dto.description || 'E-waste item scanned for pickup',
      condition: dto.condition || 'INTACT',
      estimated_weight_kg: dto.estimated_weight_kg || 5.0,
      pickup_address: dto.pickup_address,
      pickup_pincode: dto.pickup_pincode || '400001',
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: 'AGGREGATOR_REVIEW',
      ai_estimated_min_value: dto.ai_estimated_min_value || 250.0,
      ai_estimated_max_value: dto.ai_estimated_max_value || 380.0,
      agreed_purchase_price: dto.ai_estimated_min_value ? (dto.ai_estimated_min_value + dto.ai_estimated_max_value) / 2 : 300.0,
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      pickup_otp: randomOtp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.inMemoryLots.unshift(newLot);

    // If Supabase is connected, write through to PostgreSQL
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        await client.from('material_lots').insert([{
          lot_code: lotCode,
          user_id: userId,
          category_id: dto.category_id,
          material_id: dto.material_id || null,
          description: newLot.description,
          condition: newLot.condition,
          estimated_weight_kg: newLot.estimated_weight_kg,
          pickup_address: newLot.pickup_address,
          pickup_pincode: newLot.pickup_pincode,
          pickup_location: `POINT(${dto.longitude} ${dto.latitude})`,
          status: 'AGGREGATOR_REVIEW',
          ai_estimated_min_value: newLot.ai_estimated_min_value,
          ai_estimated_max_value: newLot.ai_estimated_max_value,
          pickup_otp: randomOtp,
        }]);
      } catch (err) {
        this.logger.warn(`Supabase lot write failed: ${err.message}`);
      }
    }

    await this.auditService.logEvent({
      actor_id: userId,
      actor_role: 'USER',
      action: 'LOT_CREATED',
      entity_type: 'material_lots',
      entity_id: newLot.id,
      lot_id: newLot.id,
      new_data: newLot,
    });

    return newLot;
  }

  async getAllLots(role?: string, userId?: string) {
    if (role === 'USER' && userId) {
      return this.inMemoryLots.filter((l) => l.user_id === userId || l.user_id.includes('user'));
    }
    if (role === 'COLLECTION_COLLECTOR') {
      return this.inMemoryLots.filter((l) => l.assigned_collector_id === userId || l.status === 'COLLECTOR_ASSIGNED' || l.status === 'ON_THE_WAY');
    }
    return this.inMemoryLots;
  }

  async getLotById(idOrCode: string) {
    const lot = this.inMemoryLots.find((l) => l.id === idOrCode || l.lot_code === idOrCode);
    if (!lot) {
      return this.inMemoryLots[0];
    }
    return lot;
  }

  async updateStatus(lotId: string, status: string, actorId: string, actorRole: string) {
    const lot = this.inMemoryLots.find((l) => l.id === lotId || l.lot_code === lotId);
    if (lot) {
      const oldStatus = lot.status;
      lot.status = status;
      lot.updated_at = new Date().toISOString();

      await this.auditService.logEvent({
        actor_id: actorId,
        actor_role: actorRole,
        action: `STATUS_CHANGED_TO_${status}`,
        entity_type: 'material_lots',
        entity_id: lot.id,
        lot_id: lot.id,
        old_data: { status: oldStatus },
        new_data: { status },
      });
      return lot;
    }
    return null;
  }

  async verifyPickup(lotId: string, verifiedWeightKg: number, otp: string, collectorId: string) {
    const lot = this.inMemoryLots.find((l) => l.id === lotId || l.lot_code === lotId);
    if (!lot) return null;

    if (lot.pickup_otp && lot.pickup_otp !== otp) {
      return { success: false, message: 'Invalid OTP provided by citizen.' };
    }

    lot.verified_weight_kg = verifiedWeightKg;
    lot.status = 'MATERIAL_VERIFIED';
    lot.updated_at = new Date().toISOString();

    await this.auditService.logEvent({
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      action: 'MATERIAL_VERIFIED_AND_COLLECTED',
      entity_type: 'material_lots',
      entity_id: lot.id,
      lot_id: lot.id,
      new_data: { verified_weight_kg: verifiedWeightKg, status: 'MATERIAL_VERIFIED' },
    });

    return {
      success: true,
      message: 'Material verified successfully. Payout unlocked.',
      lot,
    };
  }

  async assignCollector(lotId: string, collectorId: string, collectorName: string, aggregatorId: string) {
    const lot = this.inMemoryLots.find((l) => l.id === lotId || l.lot_code === lotId);
    if (lot) {
      lot.assigned_collector_id = collectorId;
      lot.assigned_collector_name = collectorName;
      lot.assigned_aggregator_id = aggregatorId;
      lot.status = 'COLLECTOR_ASSIGNED';
      lot.updated_at = new Date().toISOString();

      await this.auditService.logEvent({
        actor_id: aggregatorId,
        actor_role: 'INFORMAL_AGGREGATOR',
        action: 'COLLECTOR_ASSIGNED',
        entity_type: 'material_lots',
        entity_id: lot.id,
        lot_id: lot.id,
        new_data: { collector_id: collectorId, collector_name: collectorName },
      });
      return lot;
    }
    return null;
  }

  private getCategoryName(categoryId: number): string {
    const categories: Record<number, string> = {
      1: 'Cathode Ray Tube (CRT)',
      2: 'LCD / LED Flat Panel Display',
      3: 'Printed Circuit Boards (PCB)',
      4: 'Lithium-Ion / Lead Acid Battery',
      5: 'Cables & Wiring Harnesses',
      6: 'Cooling Appliances (Fridges & ACs)',
      7: 'Electronics Mixed Plastics',
    };
    return categories[categoryId] || 'General E-Waste';
  }
}
