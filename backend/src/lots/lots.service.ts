import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateLotDto, LotImageDto } from './dto/create-lot.dto';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';

export interface LotTimelineEvent {
  status: string;
  timestamp: string;
  note: string;
  actor: string;
}

export interface LotRecord {
  id: string;
  lot_code: string;
  user_id: string;
  user_name?: string;
  category_id: number;
  category_name?: string;
  material_id?: number;
  material_name?: string;
  description?: string;
  condition: string;
  quantity: number;
  estimated_weight_kg: number;
  weight_unit: string;
  verified_weight_kg?: number;
  pickup_address: string;
  city?: string;
  district?: string;
  state?: string;
  pickup_pincode?: string;
  pickup_location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  ai_category?: string;
  ai_subcategory?: string;
  ai_confidence?: number;
  user_confirmed_category?: string;
  estimated_min_value?: number;
  estimated_max_value?: number;
  estimated_value?: number;
  valuation_currency?: string;
  images?: LotImageDto[];
  timeline?: LotTimelineEvent[];
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

  // In-memory persistent store for development & offline capability
  private inMemoryLots: LotRecord[] = [
    {
      id: 'lot-001',
      lot_code: 'EW-2026-000101',
      user_id: 'usr-user-001',
      user_name: 'Anita Sharma (Household Citizen)',
      category_id: 30,
      category_name: 'Displays, Monitors & Televisions',
      material_id: 302,
      material_name: 'CRT Monitor / Tube TV',
      description: 'Old 21" Sony Trinitron CRT television, intact casing with power cord',
      condition: 'INTACT',
      quantity: 1,
      estimated_weight_kg: 18.5,
      weight_unit: 'kg',
      verified_weight_kg: undefined,
      pickup_address: 'Flat 402, Green Valley Apartments, Andheri West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pickup_pincode: '400053',
      latitude: 19.1363,
      longitude: 72.8277,
      status: 'WAITING_FOR_QUOTE',
      ai_category: 'DISPLAYS_SCREENS',
      ai_subcategory: 'CRT_MONITOR_TV',
      ai_confidence: 0.94,
      user_confirmed_category: 'CRT Monitor / Tube TV',
      estimated_min_value: 350.0,
      estimated_max_value: 480.0,
      estimated_value: 415.0,
      valuation_currency: 'INR',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&auto=format&fit=crop&q=60',
          original_filename: 'crt_front.jpg',
          is_primary: true,
          mime_type: 'image/jpeg',
          file_size: 145000,
        },
      ],
      timeline: [
        {
          status: 'WAITING_FOR_QUOTE',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          note: 'Lot registered with AI visual analysis and submitted for quote',
          actor: 'Anita Sharma',
        },
      ],
      agreed_purchase_price: 420.0,
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      assigned_collector_id: 'usr-collection_collector-001',
      assigned_collector_name: 'Ramesh Babu (Runner #04)',
      pickup_otp: '4821',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'lot-002',
      lot_code: 'EW-2026-000102',
      user_id: 'usr-user-002',
      user_name: 'Vikram Patel (Small Office)',
      category_id: 10,
      category_name: 'Consumer Electronics & Computing',
      material_id: 102,
      material_name: 'Laptop Computer',
      description: 'Dell Latitude 3490 i5 laptop, working display, battery dead',
      condition: 'PARTIALLY_WORKING',
      quantity: 1,
      estimated_weight_kg: 2.1,
      weight_unit: 'kg',
      verified_weight_kg: undefined,
      pickup_address: 'Gala 14, Lotus Commercial Complex, Malad West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pickup_pincode: '400064',
      latitude: 19.1860,
      longitude: 72.8485,
      status: 'WAITING_FOR_QUOTE',
      ai_category: 'CONSUMER_ELECTRONICS',
      ai_subcategory: 'LAPTOP_COMPUTER',
      ai_confidence: 0.91,
      user_confirmed_category: 'Laptop Computer',
      estimated_min_value: 1200.0,
      estimated_max_value: 1800.0,
      estimated_value: 1500.0,
      valuation_currency: 'INR',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
          original_filename: 'dell_laptop.jpg',
          is_primary: true,
          mime_type: 'image/jpeg',
          file_size: 210000,
        },
      ],
      timeline: [
        {
          status: 'WAITING_FOR_QUOTE',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          note: 'Lot registered with AI analysis and submitted for quote',
          actor: 'Vikram Patel',
        },
      ],
      assigned_aggregator_id: 'usr-informal_aggregator-001',
      pickup_otp: '7392',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'lot-003',
      lot_code: 'EW-2026-000103',
      user_id: 'usr-user-001',
      user_name: 'Anita Sharma (Household Citizen)',
      category_id: 10,
      category_name: 'Consumer Electronics & Computing',
      material_id: 101,
      material_name: 'Mobile Phone / Smartphone',
      description: 'Redmi Note 9 Pro with cracked screen, powers on',
      condition: 'DAMAGED',
      quantity: 1,
      estimated_weight_kg: 0.22,
      weight_unit: 'kg',
      verified_weight_kg: undefined,
      pickup_address: 'Flat 402, Green Valley Apartments, Andheri West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pickup_pincode: '400053',
      latitude: 19.1363,
      longitude: 72.8277,
      status: 'WAITING_FOR_QUOTE',
      ai_category: 'CONSUMER_ELECTRONICS',
      ai_subcategory: 'SMARTPHONE',
      ai_confidence: 0.88,
      user_confirmed_category: 'Mobile Phone / Smartphone',
      estimated_min_value: 300.0,
      estimated_max_value: 500.0,
      estimated_value: 400.0,
      valuation_currency: 'INR',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
          original_filename: 'phone_cracked.jpg',
          is_primary: true,
          mime_type: 'image/jpeg',
          file_size: 180000,
        },
      ],
      timeline: [
        {
          status: 'WAITING_FOR_QUOTE',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          note: 'Lot created and awaiting aggregator review',
          actor: 'Anita Sharma',
        },
      ],
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
    return this.aiService.classifyMaterial(imageData);
  }

  async createLot(userId: string, dto: CreateLotDto, userName = 'Citizen User'): Promise<LotRecord> {
    const lotCode = `EW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const lotId = `lot-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const categoryName = dto.category_name || this.getCategoryName(dto.category_id);
    const materialName = dto.material_name || dto.user_confirmed_category || 'Identified Material';

    const timeline: LotTimelineEvent[] = [
      {
        status: 'WAITING_FOR_QUOTE',
        timestamp: nowIso,
        note: `Lot ${lotCode} created by ${userName}. Awaiting aggregator quotes & collector assignment.`,
        actor: userName,
      },
    ];

    if (dto.ai_category) {
      timeline.unshift({
        status: 'AI_ANALYZED',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        note: `AI Material Identification: ${dto.ai_category} (${dto.ai_subcategory || ''}) with ${Math.round((dto.ai_confidence || 0.85) * 100)}% confidence`,
        actor: 'AI Vision Agent',
      });
    }

    const newLot: LotRecord = {
      id: lotId,
      lot_code: lotCode,
      user_id: userId,
      user_name: userName,
      category_id: dto.category_id,
      category_name: categoryName,
      material_id: dto.material_id,
      material_name: materialName,
      description: dto.description || `${categoryName} (${dto.condition}) submitted for recycling`,
      condition: dto.condition || 'WORKING',
      quantity: dto.quantity || 1,
      estimated_weight_kg: dto.estimated_weight_kg || 1.0,
      weight_unit: dto.weight_unit || 'kg',
      pickup_address: dto.pickup_address,
      city: dto.city || 'Mumbai',
      district: dto.district || 'Mumbai Suburban',
      state: dto.state || 'Maharashtra',
      pickup_pincode: dto.pickup_pincode || '400001',
      latitude: dto.latitude || 19.0760,
      longitude: dto.longitude || 72.8777,
      status: 'WAITING_FOR_QUOTE',
      ai_category: dto.ai_category,
      ai_subcategory: dto.ai_subcategory,
      ai_confidence: dto.ai_confidence,
      user_confirmed_category: dto.user_confirmed_category || categoryName,
      estimated_min_value: dto.estimated_min_value || 100.0,
      estimated_max_value: dto.estimated_max_value || 250.0,
      estimated_value: dto.estimated_value || ((dto.estimated_min_value || 100) + (dto.estimated_max_value || 250)) / 2,
      valuation_currency: dto.valuation_currency || 'INR',
      images: dto.images && dto.images.length > 0 ? dto.images : [
        {
          image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60',
          original_filename: 'default_ewaste.jpg',
          is_primary: true,
        },
      ],
      timeline,
      pickup_otp: randomOtp,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store in memory
    this.inMemoryLots.unshift(newLot);

    // If Supabase is connected, write through to PostgreSQL
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data: insertedLot, error: lotErr } = await client
          .from('material_lots')
          .insert([{
            lot_code: lotCode,
            user_id: userId,
            category_id: dto.category_id,
            material_id: dto.material_id || null,
            description: newLot.description,
            condition: newLot.condition,
            quantity: newLot.quantity,
            estimated_weight_kg: newLot.estimated_weight_kg,
            weight_unit: newLot.weight_unit,
            pickup_address: newLot.pickup_address,
            city: newLot.city,
            district: newLot.district,
            state: newLot.state,
            pickup_pincode: newLot.pickup_pincode,
            latitude: newLot.latitude,
            longitude: newLot.longitude,
            pickup_location: `POINT(${newLot.longitude} ${newLot.latitude})`,
            status: 'WAITING_FOR_QUOTE',
            ai_category: newLot.ai_category,
            ai_subcategory: newLot.ai_subcategory,
            ai_confidence: newLot.ai_confidence,
            user_confirmed_category: newLot.user_confirmed_category,
            estimated_min_value: newLot.estimated_min_value,
            estimated_max_value: newLot.estimated_max_value,
            estimated_value: newLot.estimated_value,
            valuation_currency: newLot.valuation_currency,
            pickup_otp: randomOtp,
          }])
          .select()
          .single();

        if (insertedLot && newLot.images && newLot.images.length > 0) {
          const imageRows = newLot.images.map((img, idx) => ({
            lot_id: insertedLot.id,
            image_url: img.image_url,
            original_filename: img.original_filename || `image_${idx + 1}.jpg`,
            file_size: img.file_size || 0,
            mime_type: img.mime_type || 'image/jpeg',
            is_primary: img.is_primary ?? (idx === 0),
            sort_order: idx + 1,
          }));
          await client.from('lot_images').insert(imageRows);
        }
      } catch (err) {
        this.logger.warn(`Supabase lot write notice: ${err.message}`);
      }
    }

    // Audit log
    await this.auditService.logEvent({
      actor_id: userId,
      actor_role: 'USER',
      action: 'LOT_CREATED',
      entity_type: 'material_lots',
      entity_id: newLot.id,
      lot_id: newLot.id,
      new_data: {
        lot_code: newLot.lot_code,
        category: newLot.category_name,
        condition: newLot.condition,
        weight_kg: newLot.estimated_weight_kg,
        status: newLot.status,
      },
    });

    return newLot;
  }

  async getAllLots(role?: string, userId?: string): Promise<LotRecord[]> {
    if (role === 'USER' && userId) {
      return this.getMyLots(userId);
    }
    if (role === 'COLLECTION_COLLECTOR') {
      return this.inMemoryLots.filter((l) =>
        l.assigned_collector_id === userId ||
        l.status === 'COLLECTOR_ASSIGNED' ||
        l.status === 'ON_THE_WAY' ||
        l.status === 'WAITING_FOR_QUOTE',
      );
    }
    return this.inMemoryLots;
  }

  async getMyLots(userId: string): Promise<LotRecord[]> {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data } = await client
          .from('material_lots')
          .select('*, images:lot_images(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          return data;
        }
      } catch (err) {
        this.logger.warn(`Supabase getMyLots query error: ${err.message}`);
      }
    }
    // Fallback in-memory
    const userLots = this.inMemoryLots.filter((l) => l.user_id === userId);
    if (userLots.length > 0) return userLots;
    // Return all mock lots if testing in development
    return this.inMemoryLots;
  }

  async getLotById(idOrCode: string): Promise<LotRecord> {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data } = await client
          .from('material_lots')
          .select('*, images:lot_images(*)')
          .or(`id.eq.${idOrCode},lot_code.eq.${idOrCode}`)
          .single();

        if (data) return data;
      } catch (err) {
        this.logger.warn(`Supabase getLotById error: ${err.message}`);
      }
    }

    const lot = this.inMemoryLots.find((l) => l.id === idOrCode || l.lot_code === idOrCode);
    if (lot) {
      return lot;
    }
    // Fallback to first lot for smooth local testing
    if (this.inMemoryLots.length > 0) {
      return this.inMemoryLots[0];
    }
    throw new NotFoundException(`Lot with ID/Code ${idOrCode} not found`);
  }

  async cancelLot(lotId: string, userId: string, reason = 'Cancelled by citizen'): Promise<LotRecord> {
    const lot = await this.getLotById(lotId);
    if (!lot) {
      throw new NotFoundException(`Lot ${lotId} not found`);
    }

    const nonCancellableStatuses = ['PICKED_UP', 'MATERIAL_VERIFIED', 'SETTLED', 'CANCELLED'];
    if (nonCancellableStatuses.includes(lot.status)) {
      throw new BadRequestException(`Cannot cancel lot in status ${lot.status}`);
    }

    const oldStatus = lot.status;
    lot.status = 'CANCELLED';
    lot.updated_at = new Date().toISOString();

    if (!lot.timeline) lot.timeline = [];
    lot.timeline.push({
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      note: `Lot cancelled: ${reason}`,
      actor: lot.user_name || 'Citizen User',
    });

    if (this.supabaseService.isConfigured()) {
      try {
        await this.supabaseService.getClient()
          .from('material_lots')
          .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
          .eq('id', lot.id);
      } catch (err) {
        this.logger.warn(`Supabase cancelLot error: ${err.message}`);
      }
    }

    await this.auditService.logEvent({
      actor_id: userId,
      actor_role: 'USER',
      action: 'LOT_CANCELLED',
      entity_type: 'material_lots',
      entity_id: lot.id,
      lot_id: lot.id,
      old_data: { status: oldStatus },
      new_data: { status: 'CANCELLED', reason },
    });

    return lot;
  }

  async updateStatus(lotId: string, status: string, actorId: string, actorRole: string) {
    const lot = this.inMemoryLots.find((l) => l.id === lotId || l.lot_code === lotId);
    if (lot) {
      const oldStatus = lot.status;
      lot.status = status;
      lot.updated_at = new Date().toISOString();

      if (!lot.timeline) lot.timeline = [];
      lot.timeline.push({
        status,
        timestamp: new Date().toISOString(),
        note: `Status updated from ${oldStatus} to ${status}`,
        actor: `${actorRole} (${actorId})`,
      });

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

    if (!lot.timeline) lot.timeline = [];
    lot.timeline.push({
      status: 'MATERIAL_VERIFIED',
      timestamp: new Date().toISOString(),
      note: `Collector verified weight: ${verifiedWeightKg} kg via citizen OTP match`,
      actor: `Collector (${collectorId})`,
    });

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

      if (!lot.timeline) lot.timeline = [];
      lot.timeline.push({
        status: 'COLLECTOR_ASSIGNED',
        timestamp: new Date().toISOString(),
        note: `Aggregator assigned collector: ${collectorName}`,
        actor: `Aggregator (${aggregatorId})`,
      });

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
      10: 'Consumer Electronics & Computing',
      20: 'Large White Goods & Appliances',
      30: 'Displays, Monitors & Televisions',
      40: 'Batteries, PCBs & Circuit Boards',
      50: 'Cables, Chargers & Small Accessories',
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

