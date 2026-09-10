import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Injectable,
  Module,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActiveAccountGuard } from '../common/guards/active-account.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { TraceabilityService } from '../traceability/traceability.module';
import {
  UpdateAvailabilityDto,
  UpdateCollectorProfileDto,
  RejectAssignmentDto,
  LocationDto,
  VerifyMaterialDto,
  AddPhotoDto,
  CompleteCollectionDto,
  SyncQueueDto,
} from './dto/collector.dto';

@Injectable()
export class CollectorsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  private client() {
    return this.supabaseService.getAdminClient();
  }

  // 1. Collector Dashboard
  async getDashboard(collectorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        availability: 'AVAILABLE',
        metrics: {
          today_assignments: 3,
          pending_assignments: 1,
          accepted_assignments: 1,
          on_the_way: 0,
          completed_today: 1,
          today_collected_weight_kg: 18.5,
          today_estimated_earnings: 450.0,
          total_completed_collections: 42,
        },
        profile: {
          full_name: 'Vikram Shinde',
          vehicle_type: 'MINI_TRUCK',
          rating: 4.9,
          reliability_score: 96.5,
        },
        recent_assignments: [],
      };
    }

    const client = this.client();
    const today = new Date().toISOString().slice(0, 10);

    // Get collector profile & availability
    const { data: collector } = await client
      .from('collectors')
      .select('*')
      .eq('id', collectorId)
      .maybeSingle();

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', collectorId)
      .maybeSingle();

    // Get assignments
    const { data: assignments } = await client
      .from('collector_assignments')
      .select('*, material_lots(*)')
      .eq('collector_id', collectorId)
      .order('assigned_at', { ascending: false });

    const allAssignments = assignments || [];
    const todayAssignments = allAssignments.filter(
      (a: any) => a.assigned_at && a.assigned_at.slice(0, 10) === today,
    );

    const pending = allAssignments.filter((a: any) => a.status === 'PENDING' || a.status === 'OFFERED');
    const accepted = allAssignments.filter((a: any) => a.status === 'ACCEPTED');
    const onTheWay = allAssignments.filter(
      (a: any) => a.status === 'ON_THE_WAY' || a.status === 'ARRIVED' || a.status === 'MATERIAL_VERIFIED',
    );
    const completedToday = allAssignments.filter(
      (a: any) => (a.status === 'COLLECTED' || a.status === 'COMPLETED') && a.collected_at?.slice(0, 10) === today,
    );

    const todayWeight = completedToday.reduce(
      (sum: number, a: any) => sum + Number(a.material_lots?.verified_weight || a.estimated_weight || 0),
      0,
    );
    const todayEarnings = completedToday.reduce(
      (sum: number, a: any) => sum + Number(a.collector_earning || a.payout_amount || 0),
      0,
    );

    return {
      availability: collector?.availability || 'AVAILABLE',
      metrics: {
        today_assignments: todayAssignments.length,
        pending_assignments: pending.length,
        accepted_assignments: accepted.length,
        on_the_way: onTheWay.length,
        completed_today: completedToday.length,
        today_collected_weight_kg: Number(todayWeight.toFixed(2)),
        today_estimated_earnings: Number(todayEarnings.toFixed(2)),
        total_completed_collections: collector?.total_pickups_completed || 0,
      },
      profile: {
        full_name: profile?.full_name || 'Field Collector',
        phone: profile?.phone || '',
        vehicle_type: collector?.vehicle_type || 'AUTO_RICKSHAW',
        rating: Number(collector?.rating || 5.0),
        reliability_score: Number(collector?.reliability_score || 95.0),
      },
      recent_assignments: allAssignments.slice(0, 5),
    };
  }

  // 2. Collector Profile
  async getProfile(collectorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        id: collectorId,
        full_name: 'Vikram Shinde',
        phone: '+919876543210',
        area: 'Central District',
        district: 'Mumbai',
        state: 'Maharashtra',
        service_radius_km: 10,
        vehicle_type: 'MINI_TRUCK',
        vehicle_registration_no: 'MH-02-BT-4122',
        availability: 'AVAILABLE',
        is_verified: true,
        reliability_score: 96.5,
        rating: 4.9,
        total_pickups_completed: 42,
        total_collected_weight_kg: 520.4,
        total_earnings: 12400.0,
      };
    }

    const { data: collector } = await this.client()
      .from('collectors')
      .select('*')
      .eq('id', collectorId)
      .maybeSingle();

    const { data: profile } = await this.client()
      .from('profiles')
      .select('*')
      .eq('id', collectorId)
      .maybeSingle();

    if (!collector && !profile) {
      return {
        id: collectorId,
        full_name: 'Ramesh Babu',
        phone: '+919876543212',
        avatar_url: null,
        area: 'Kurla West',
        district: 'Mumbai',
        state: 'Maharashtra',
        service_radius_km: 15,
        vehicle_type: 'AUTO_RICKSHAW',
        vehicle_registration_no: 'MH-02-BT-4122',
        availability: 'AVAILABLE',
        is_verified: true,
        reliability_score: 98.5,
        rating: 4.9,
        total_pickups_completed: 34,
        total_collected_weight_kg: 480.5,
        total_earnings: 5200.0,
      };
    }

    return {
      id: collector?.id || collectorId,
      full_name: profile?.full_name || 'Ramesh Babu',
      phone: profile?.phone || '+919876543212',
      avatar_url: profile?.avatar_url,
      area: collector?.area || 'Kurla West',
      district: collector?.district || 'Mumbai',
      state: collector?.state || 'Maharashtra',
      service_radius_km: Number(collector?.service_radius_km || 15),
      vehicle_type: collector?.vehicle_type || 'AUTO_RICKSHAW',
      vehicle_registration_no: collector?.vehicle_registration_no || 'MH-02-BT-4122',
      availability: collector?.availability || 'AVAILABLE',
      is_verified: profile?.is_verified ?? true,
      reliability_score: Number(collector?.reliability_score || 98.5),
      rating: Number(collector?.rating || 4.9),
      total_pickups_completed: collector?.total_pickups_completed || 34,
      total_collected_weight_kg: Number(collector?.total_collected_weight_kg || 480.5),
      total_earnings: Number(collector?.total_earnings || 5200.0),
    };
  }

  async updateProfile(collectorId: string, dto: UpdateCollectorProfileDto) {
    if (!this.supabaseService.isConfigured()) return { success: true, updated: dto };

    const updateData: any = {};
    if (dto.area !== undefined) updateData.area = dto.area;
    if (dto.district !== undefined) updateData.district = dto.district;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.service_radius_km !== undefined) updateData.service_radius_km = dto.service_radius_km;
    if (dto.vehicle_type !== undefined) updateData.vehicle_type = dto.vehicle_type;
    if (dto.vehicle_registration_no !== undefined) updateData.vehicle_registration_no = dto.vehicle_registration_no;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.client()
      .from('collectors')
      .update(updateData)
      .eq('id', collectorId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data || { id: collectorId, ...dto, updated_at: new Date().toISOString() };
  }

  // 3. Collector Availability
  async updateAvailability(collectorId: string, availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE') {
    if (!this.supabaseService.isConfigured()) return { availability };

    const { data, error } = await this.client()
      .from('collectors')
      .update({
        availability,
        is_available: availability === 'AVAILABLE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectorId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    await this.auditService.logEvent({
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      action: 'COLLECTOR_AVAILABILITY_CHANGED',
      entity_type: 'collectors',
      entity_id: collectorId,
      new_data: { availability },
    });

    return data || {
      id: collectorId,
      availability,
      is_available: availability === 'AVAILABLE',
      updated_at: new Date().toISOString(),
    };
  }

  // 4. Assignments Inbox & Filters
  async getAssignments(collectorId: string, filters: { status?: string; search?: string }) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: 'assign-demo-01',
          assignment_code: 'CA-2026-000101',
          lot_id: 'lot-demo-01',
          status: 'PENDING',
          estimated_weight: 8.5,
          expected_amount: 450.0,
          collector_earning: 180.0,
          pickup_area: 'Andheri West, Mumbai',
          distance_km: 2.3,
          created_at: new Date().toISOString(),
          material_category: 'CONSUMER_ELECTRONICS',
          material_lots: {
            lot_code: 'EW-2026-000101',
            user_confirmed_category: 'CONSUMER_ELECTRONICS',
            city: 'Mumbai',
            address_line: 'Flat 402, Green Valley Apartments',
          },
        },
      ];
    }

    const client = this.client();
    let query = client
      .from('collector_assignments')
      .select('*, material_lots(*)')
      .eq('collector_id', collectorId)
      .order('assigned_at', { ascending: false });

    if (filters.status) {
      const s = filters.status.toUpperCase();
      if (s === 'PENDING') query = query.in('status', ['PENDING', 'OFFERED']);
      else if (s === 'ACCEPTED') query = query.eq('status', 'ACCEPTED');
      else if (s === 'ACTIVE') query = query.in('status', ['ON_THE_WAY', 'ARRIVED', 'MATERIAL_VERIFIED']);
      else if (s === 'COMPLETED') query = query.in('status', ['COLLECTED', 'COMPLETED']);
      else if (s === 'CANCELLED') query = query.in('status', ['REJECTED', 'CANCELLED', 'EXPIRED']);
      else query = query.eq('status', s);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    let result = data || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a: any) =>
          a.assignment_code?.toLowerCase().includes(q) ||
          a.material_lots?.lot_code?.toLowerCase().includes(q) ||
          a.material_lots?.city?.toLowerCase().includes(q) ||
          a.material_lots?.address_line?.toLowerCase().includes(q),
      );
    }

    return result;
  }

  // 5. Assignment Detail
  async getAssignmentDetail(assignmentId: string, collectorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        id: assignmentId,
        assignment_code: 'CA-2026-000101',
        lot_id: 'lot-demo-01',
        status: 'PENDING',
        collector_id: collectorId,
        estimated_weight: 8.5,
        expected_amount: 450.0,
        collector_earning: 180.0,
        pickup_latitude: 19.1197,
        pickup_longitude: 72.8464,
        material_lots: {
          id: 'lot-demo-01',
          lot_code: 'EW-2026-000101',
          ai_category: 'CONSUMER_ELECTRONICS',
          user_confirmed_category: 'CONSUMER_ELECTRONICS',
          city: 'Mumbai',
          address_line: 'Flat 402, Green Valley Apartments, Andheri West',
          pickup_time_preference: 'Morning (9 AM - 12 PM)',
        },
        verifications: [],
        photos: [],
      };
    }

    const { data: assignment, error } = await this.client()
      .from('collector_assignments')
      .select('*, material_lots(*)')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('This assignment is not assigned to you');

    // Fetch verifications & photos
    const { data: verifications } = await this.client()
      .from('collection_verifications')
      .select('*')
      .eq('assignment_id', assignmentId);

    const { data: photos } = await this.client()
      .from('collection_photos')
      .select('*')
      .eq('assignment_id', assignmentId);

    return {
      ...assignment,
      verifications: verifications || [],
      photos: photos || [],
    };
  }

  // 6. Accept Assignment
  async acceptAssignment(assignmentId: string, collectorId: string) {
    const client = this.client();
    const { data: collector } = await client
      .from('collectors')
      .select('availability')
      .eq('id', collectorId)
      .maybeSingle();
    if (collector?.availability !== 'AVAILABLE') {
      throw new ConflictException('Only available collectors can accept a new assignment.');
    }
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('You are not assigned to this lot');
    if (!['PENDING', 'OFFERED'].includes(assignment.status)) {
      throw new BadRequestException(`Cannot accept assignment in ${assignment.status} state`);
    }

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'ACCEPTED',
        accepted_at: now,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update lot status
    await client
      .from('material_lots')
      .update({ status: 'COLLECTOR_ASSIGNED' })
      .eq('id', assignment.lot_id);

    await this.auditService.logEvent({
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      action: 'COLLECTOR_ASSIGNMENT_ACCEPTED',
      entity_type: 'collector_assignments',
      entity_id: assignmentId,
      lot_id: assignment.lot_id,
    });

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'COLLECTOR_ASSIGNMENT_ACCEPTED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: 'PENDING',
      to_status: 'ACCEPTED',
    });

    return data;
  }

  // 7. Reject Assignment
  async rejectAssignment(assignmentId: string, collectorId: string, dto: RejectAssignmentDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('You are not assigned to this lot');

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'REJECTED',
        rejected_at: now,
        rejection_reason: dto.reason,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Release lot back to WAITING_FOR_QUOTE so another collector can be assigned
    await client
      .from('material_lots')
      .update({ status: 'WAITING_FOR_QUOTE' })
      .eq('id', assignment.lot_id);

    await this.auditService.logEvent({
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      action: 'COLLECTOR_ASSIGNMENT_REJECTED',
      entity_type: 'collector_assignments',
      entity_id: assignmentId,
      lot_id: assignment.lot_id,
      new_data: { reason: dto.reason },
    });

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'COLLECTOR_ASSIGNMENT_REJECTED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: 'PENDING',
      to_status: 'REJECTED',
      metadata: { reason: dto.reason },
    });

    return data;
  }

  // 8. Start Collection (On The Way)
  async startCollection(assignmentId: string, collectorId: string, dto: LocationDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('Unauthorized');
    if (assignment.status !== 'ACCEPTED') {
      throw new BadRequestException(`Cannot start collection when status is ${assignment.status}`);
    }

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'ON_THE_WAY',
        started_at: now,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Record event location if GPS provided
    if (dto.latitude && dto.longitude) {
      await client.from('collector_locations').insert([
        {
          collector_id: collectorId,
          assignment_id: assignmentId,
          event_type: 'START',
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy || null,
        },
      ]);
    }

    // Update lot status
    await client
      .from('material_lots')
      .update({ status: 'ON_THE_WAY' })
      .eq('id', assignment.lot_id);

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'COLLECTION_STARTED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: 'ACCEPTED',
      to_status: 'ON_THE_WAY',
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    return data;
  }

  // 9. Mark Arrived
  async markArrived(assignmentId: string, collectorId: string, dto: LocationDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('Unauthorized');
    if (assignment.status !== 'ON_THE_WAY') {
      throw new BadRequestException(`Cannot mark arrived from ${assignment.status}`);
    }

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'ARRIVED',
        arrived_at: now,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    if (dto.latitude && dto.longitude) {
      await client.from('collector_locations').insert([
        {
          collector_id: collectorId,
          assignment_id: assignmentId,
          event_type: 'ARRIVED',
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy || null,
        },
      ]);
    }

    await client
      .from('material_lots')
      .update({ status: 'ARRIVED' })
      .eq('id', assignment.lot_id);

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'COLLECTOR_ARRIVED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: 'ON_THE_WAY',
      to_status: 'ARRIVED',
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    return data;
  }

  // 10. Verify Material & Weight
  async verifyMaterial(assignmentId: string, collectorId: string, dto: VerifyMaterialDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('Unauthorized');

    const now = new Date().toISOString();

    // Insert verification record
    const { data: verification, error: verErr } = await client
      .from('collection_verifications')
      .insert([
        {
          assignment_id: assignmentId,
          lot_id: assignment.lot_id,
          collector_id: collectorId,
          verified_category_id: dto.verified_category_id || null,
          verified_category_name: dto.verified_category_name || 'Electronics',
          verified_material_id: dto.verified_material_id || null,
          condition: dto.condition,
          verified_weight: dto.verified_weight,
          weight_unit: dto.weight_unit || 'kg',
          weighing_method: dto.weighing_method || 'DIGITAL_SCALE',
          scale_reference: dto.scale_reference || null,
          notes: dto.notes || null,
          latitude: dto.latitude || null,
          longitude: dto.longitude || null,
        },
      ])
      .select()
      .single();

    if (verErr) throw new BadRequestException(verErr.message);

    // Update assignment status to MATERIAL_VERIFIED
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'MATERIAL_VERIFIED',
        verified_at: now,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update lot status and verified weight
    await client
      .from('material_lots')
      .update({
        status: 'MATERIAL_VERIFIED',
        verified_weight: dto.verified_weight,
        verified_category: dto.verified_category_name || 'Electronics',
        condition: dto.condition,
      })
      .eq('id', assignment.lot_id);

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'MATERIAL_VERIFIED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: assignment.status,
      to_status: 'MATERIAL_VERIFIED',
      metadata: {
        verified_weight: dto.verified_weight,
        condition: dto.condition,
        category: dto.verified_category_name,
      },
    });

    return { assignment: data, verification };
  }

  // 11. Add Collection Photos
  async addPhoto(assignmentId: string, collectorId: string, dto: AddPhotoDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('Unauthorized');

    const { data, error } = await client
      .from('collection_photos')
      .insert([
        {
          assignment_id: assignmentId,
          lot_id: assignment.lot_id,
          collector_id: collectorId,
          storage_path: dto.storage_path,
          photo_type: dto.photo_type,
          latitude: dto.latitude || null,
          longitude: dto.longitude || null,
        },
      ])
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'COLLECTION_PHOTO_ADDED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      metadata: { photo_type: dto.photo_type, storage_path: dto.storage_path },
    });

    return data;
  }

  // 12. Complete Collection
  async completeCollection(assignmentId: string, collectorId: string, dto: CompleteCollectionDto) {
    const client = this.client();
    const { data: assignment, error: fetchErr } = await client
      .from('collector_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) throw new NotFoundException('Assignment not found');
    if (assignment.collector_id !== collectorId) throw new ForbiddenException('Unauthorized');

    // Idempotency: If already collected, return existing state
    if (assignment.status === 'COLLECTED' || assignment.status === 'COMPLETED') {
      return { status: 'ALREADY_COMPLETED', assignment };
    }

    if (assignment.status !== 'MATERIAL_VERIFIED') {
      throw new BadRequestException(`Collection can only be completed after verification. Current status: ${assignment.status}`);
    }

    const { data: verification, error: verificationError } = await client
      .from('collection_verifications')
      .select('verified_weight, condition, verified_category_name')
      .eq('assignment_id', assignmentId)
      .eq('collector_id', collectorId)
      .order('verified_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (verificationError || !verification) {
      throw new BadRequestException('Material verification, actual weight, and condition are required before completion.');
    }

    const { count: proofCount, error: proofError } = await client
      .from('collection_photos')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)
      .eq('collector_id', collectorId);
    if (proofError || !proofCount) {
      throw new BadRequestException('At least one collection proof photo is required before completion.');
    }

    const now = new Date().toISOString();

    // If proof photo passed, store in collection_photos
    if (dto.proof_storage_path) {
      await client.from('collection_photos').insert([
        {
          assignment_id: assignmentId,
          lot_id: assignment.lot_id,
          collector_id: collectorId,
          storage_path: dto.proof_storage_path,
          photo_type: 'COLLECTION_PROOF',
          latitude: dto.latitude || null,
          longitude: dto.longitude || null,
        },
      ]);
    }

    // Update assignment to COLLECTED
    const { data, error } = await client
      .from('collector_assignments')
      .update({
        status: 'COLLECTED',
        collected_at: now,
        collector_notes: dto.notes || assignment.collector_notes,
        updated_at: now,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update lot status to COLLECTED
    await client
      .from('material_lots')
      .update({
        status: 'COLLECTED',
        verified_weight: verification.verified_weight,
      })
      .eq('id', assignment.lot_id);

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await client.from('collector_locations').insert([{
        collector_id: collectorId,
        assignment_id: assignmentId,
        event_type: 'COLLECTED',
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: null,
      }]);
    }

    // Create preliminary earnings ledger entry (status: PENDING)
    const earningAmount = Number(assignment.collector_earning || assignment.payout_amount || 250.0);
    await client.from('earnings_ledger').insert([
      {
        user_id: collectorId,
        collector_id: collectorId,
        assignment_id: assignmentId,
        reference_lot_id: assignment.lot_id,
        entry_type: 'CREDIT',
        earning_type: 'COLLECTION_FEE',
        amount: earningAmount,
        currency: 'INR',
        balance_after: earningAmount,
        status: 'PENDING',
        description: `Field collection completed for lot code ${assignment.assignment_code || assignmentId}`,
      },
    ]);

    // Update collector performance statistics
    const { data: currentCollector } = await client
      .from('collectors')
      .select('total_pickups_completed, total_collected_weight_kg, total_earnings')
      .eq('id', collectorId)
      .single();

    if (currentCollector) {
      const addedWeight = Number(verification.verified_weight);
      await client
        .from('collectors')
        .update({
          total_pickups_completed: (currentCollector.total_pickups_completed || 0) + 1,
          total_collected_weight_kg: Number((currentCollector.total_collected_weight_kg || 0) + addedWeight),
          total_earnings: Number((currentCollector.total_earnings || 0) + earningAmount),
          updated_at: now,
        })
        .eq('id', collectorId);
    }

    // Append append-only traceability event
    await this.traceabilityService.appendEvent({
      lot_id: assignment.lot_id,
      event_type: 'MATERIAL_COLLECTED',
      actor_id: collectorId,
      actor_role: 'COLLECTION_COLLECTOR',
      from_status: assignment.status,
      to_status: 'COLLECTED',
      latitude: dto.latitude,
      longitude: dto.longitude,
      metadata: {
        verified_weight: verification.verified_weight,
        verified_material: verification.verified_category_name,
        condition: verification.condition,
        notes: dto.notes,
      },
    });

    return { success: true, assignment: data };
  }

  // 13. Collector Earnings Summary
  async getEarnings(collectorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        pending_balance: 450.0,
        paid_balance: 12400.0,
        total_balance: 12850.0,
        records: [
          {
            id: 'earn-1',
            entry_type: 'CREDIT',
            earning_type: 'COLLECTION_FEE',
            amount: 250.0,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            description: 'Field collection fee for EW-2026-000101',
          },
        ],
      };
    }

    const { data: records, error } = await this.client()
      .from('earnings_ledger')
      .select('*')
      .eq('user_id', collectorId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    const items = records || [];
    const pending = items
      .filter((r: any) => r.status === 'PENDING')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const paid = items
      .filter((r: any) => r.status === 'PAID')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

    return {
      pending_balance: Number(pending.toFixed(2)),
      paid_balance: Number(paid.toFixed(2)),
      total_balance: Number((pending + paid).toFixed(2)),
      records: items,
    };
  }

  // 14. Offline Sync Queue Processor
  async syncOfflineQueue(collectorId: string, dto: SyncQueueDto) {
    const results = [];
    const client = this.client();

    for (const op of dto.operations) {
      try {
        const { data: assignment } = await client
          .from('collector_assignments')
          .select('*')
          .eq('id', op.assignment_id)
          .single();

        if (!assignment) {
          results.push({ id: op.id, status: 'CONFLICT', reason: 'Assignment not found on server' });
          continue;
        }

        if (assignment.collector_id !== collectorId) {
          results.push({ id: op.id, status: 'CONFLICT', reason: 'Collector authorization mismatch' });
          continue;
        }

        // Operation dispatch
        if (op.operation === 'START_COLLECTION') {
          if (assignment.status === 'ACCEPTED') {
            await this.startCollection(op.assignment_id, collectorId, op.payload || {});
            results.push({ id: op.id, status: 'SYNCED' });
          } else {
            results.push({ id: op.id, status: 'CONFLICT', reason: `Server status is ${assignment.status}` });
          }
        } else if (op.operation === 'ARRIVED') {
          if (assignment.status === 'ON_THE_WAY') {
            await this.markArrived(op.assignment_id, collectorId, op.payload || {});
            results.push({ id: op.id, status: 'SYNCED' });
          } else {
            results.push({ id: op.id, status: 'CONFLICT', reason: `Server status is ${assignment.status}` });
          }
        } else if (op.operation === 'VERIFY_MATERIAL') {
          await this.verifyMaterial(op.assignment_id, collectorId, op.payload);
          results.push({ id: op.id, status: 'SYNCED' });
        } else if (op.operation === 'COLLECTION_COMPLETED') {
          if (['ARRIVED', 'MATERIAL_VERIFIED', 'ON_THE_WAY'].includes(assignment.status)) {
            await this.completeCollection(op.assignment_id, collectorId, op.payload);
            results.push({ id: op.id, status: 'SYNCED' });
          } else if (assignment.status === 'COLLECTED') {
            results.push({ id: op.id, status: 'SYNCED', note: 'Already recorded' });
          } else {
            results.push({ id: op.id, status: 'CONFLICT', reason: `Invalid server status ${assignment.status}` });
          }
        } else {
          results.push({ id: op.id, status: 'CONFLICT', reason: `Unknown operation ${op.operation}` });
        }
      } catch (err: any) {
        results.push({ id: op.id, status: 'CONFLICT', reason: err.message });
      }
    }

    return { results, timestamp: new Date().toISOString() };
  }
}

@ApiTags('Collectors')
@Controller(['collector', 'collectors'])
@UseGuards(AuthGuard, RolesGuard, ActiveAccountGuard)
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) {}

  @Get('dashboard')
  @Roles('COLLECTION_COLLECTOR', 'INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mobile-first collector dashboard data' })
  async getDashboard(@CurrentUser() user: any) {
    return this.collectorsService.getDashboard(user.id);
  }

  @Get('profile')
  @Roles('COLLECTION_COLLECTOR', 'GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collector operational profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.collectorsService.getProfile(user.id);
  }

  @Patch('profile')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permitted collector profile fields' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateCollectorProfileDto) {
    return this.collectorsService.updateProfile(user.id, dto);
  }

  @Patch('availability')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set collector availability (AVAILABLE, BUSY, OFFLINE)' })
  async updateAvailability(@CurrentUser() user: any, @Body() dto: UpdateAvailabilityDto) {
    return this.collectorsService.updateAvailability(user.id, dto.availability);
  }

  @Get('assignments')
  @Roles('COLLECTION_COLLECTOR', 'GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List collector assignments with status filters and search' })
  async getAssignments(@CurrentUser() user: any, @Query() query: any) {
    return this.collectorsService.getAssignments(user.id, query);
  }

  @Get('assignments/:id')
  @Roles('COLLECTION_COLLECTOR', 'INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed assignment view with lot and verification history' })
  async getAssignmentDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.collectorsService.getAssignmentDetail(id, user.id);
  }

  @Post('assignments/:id/accept')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept field pickup assignment' })
  async acceptAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.collectorsService.acceptAssignment(id, user.id);
  }

  @Post('assignments/:id/reject')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject field pickup assignment with reason' })
  async rejectAssignment(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectAssignmentDto) {
    return this.collectorsService.rejectAssignment(id, user.id, dto);
  }

  @Post('assignments/:id/start')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start collection travel (ON_THE_WAY)' })
  async startCollection(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: LocationDto) {
    return this.collectorsService.startCollection(id, user.id, dto);
  }

  @Post('assignments/:id/arrive')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark arrival at pickup location (ARRIVED)' })
  async markArrived(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: LocationDto) {
    return this.collectorsService.markArrived(id, user.id, dto);
  }

  @Post('assignments/:id/verify')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record actual material category, condition, and scale weight' })
  async verifyMaterial(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: VerifyMaterialDto) {
    return this.collectorsService.verifyMaterial(id, user.id, dto);
  }

  @Post('assignments/:id/photos')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link scale and material proof photos' })
  async addPhoto(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AddPhotoDto) {
    return this.collectorsService.addPhoto(id, user.id, dto);
  }

  @Post('assignments/:id/complete')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete field collection and trigger pending earnings record' })
  async completeCollection(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CompleteCollectionDto) {
    return this.collectorsService.completeCollection(id, user.id, dto);
  }

  @Get('earnings')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collector earnings breakdown and pending ledger' })
  async getEarnings(@CurrentUser() user: any) {
    return this.collectorsService.getEarnings(user.id);
  }

  @Post('sync')
  @Roles('COLLECTION_COLLECTOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronize offline action queue with conflict detection' })
  async syncOfflineQueue(@CurrentUser() user: any, @Body() dto: SyncQueueDto) {
    return this.collectorsService.syncOfflineQueue(user.id, dto);
  }
}

@Module({
  controllers: [CollectorsController],
  providers: [CollectorsService, SupabaseService, AuditService, TraceabilityService, ActiveAccountGuard],
  exports: [CollectorsService],
})
export class CollectorsModule {}
