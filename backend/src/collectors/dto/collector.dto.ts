import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: ['AVAILABLE', 'BUSY', 'OFFLINE'] })
  @IsString()
  @IsIn(['AVAILABLE', 'BUSY', 'OFFLINE'])
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export class UpdateCollectorProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  service_radius_km?: number;

  @ApiPropertyOptional({ enum: ['BICYCLE', 'MOTORCYCLE', 'AUTO_RICKSHAW', 'MINI_TRUCK', 'ON_FOOT'] })
  @IsOptional()
  @IsString()
  @IsIn(['BICYCLE', 'MOTORCYCLE', 'AUTO_RICKSHAW', 'MINI_TRUCK', 'ON_FOOT'])
  vehicle_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicle_registration_no?: string;
}

export class RejectAssignmentDto {
  @ApiProperty({ description: 'Reason for rejecting field pickup assignment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class LocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class VerifyMaterialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  verified_category_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verified_category_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  verified_material_id?: number;

  @ApiProperty({ enum: ['WORKING', 'PARTIALLY_WORKING', 'NON_WORKING', 'DAMAGED', 'UNKNOWN'] })
  @IsString()
  @IsIn(['WORKING', 'PARTIALLY_WORKING', 'NON_WORKING', 'DAMAGED', 'UNKNOWN'])
  condition: 'WORKING' | 'PARTIALLY_WORKING' | 'NON_WORKING' | 'DAMAGED' | 'UNKNOWN';

  @ApiProperty({ description: 'Actual verified weight measured by field scale in kg' })
  @IsNumber()
  @Min(0.01)
  verified_weight: number;

  @ApiPropertyOptional({ default: 'kg' })
  @IsOptional()
  @IsString()
  weight_unit?: string;

  @ApiPropertyOptional({ default: 'DIGITAL_SCALE' })
  @IsOptional()
  @IsString()
  weighing_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scale_reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class AddPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storage_path: string;

  @ApiProperty({ enum: ['MATERIAL', 'WEIGHING_SCALE', 'CONDITION', 'COLLECTION_PROOF'] })
  @IsString()
  @IsIn(['MATERIAL', 'WEIGHING_SCALE', 'CONDITION', 'COLLECTION_PROOF'])
  photo_type: 'MATERIAL' | 'WEIGHING_SCALE' | 'CONDITION' | 'COLLECTION_PROOF';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CompleteCollectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  verified_weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proof_storage_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class SyncQueueDto {
  @ApiProperty({ isArray: true })
  @IsArray()
  operations: Array<{
    id: string;
    operation: string;
    assignment_id: string;
    payload: any;
    created_at: string;
  }>;
}
