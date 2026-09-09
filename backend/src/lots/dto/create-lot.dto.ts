import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LotImageDto {
  @ApiProperty({ example: 'data:image/jpeg;base64,...' })
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty({ example: 'laptop_front.jpg', required: false })
  @IsString()
  @IsOptional()
  original_filename?: string;

  @ApiProperty({ example: 245000, required: false })
  @IsNumber()
  @IsOptional()
  file_size?: number;

  @ApiProperty({ example: 'image/jpeg', required: false })
  @IsString()
  @IsOptional()
  mime_type?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  is_primary?: boolean;
}

export class CreateLotDto {
  @ApiProperty({ example: 10, description: 'Material category ID' })
  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @ApiProperty({ example: 'Consumer Electronics & Computing', required: false })
  @IsString()
  @IsOptional()
  category_name?: string;

  @ApiProperty({ example: 102, description: 'Specific material / subcategory ID', required: false })
  @IsNumber()
  @IsOptional()
  material_id?: number;

  @ApiProperty({ example: 'Laptop Computer', required: false })
  @IsString()
  @IsOptional()
  material_name?: string;

  @ApiProperty({ example: 'Old Dell Latitude laptop with charger, battery slightly degraded' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'WORKING', enum: ['WORKING', 'PARTIALLY_WORKING', 'NOT_WORKING', 'DAMAGED', 'SCRAP_BROKEN', 'UNKNOWN', 'INTACT'] })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({ example: 1, description: 'Number of units / items' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 2.4, description: 'Estimated weight' })
  @IsNumber()
  @IsOptional()
  estimated_weight_kg?: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'unit'] })
  @IsString()
  @IsOptional()
  weight_unit?: string;

  @ApiProperty({ example: 'Flat 402, Green Valley Apartments, MG Road' })
  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Mumbai Suburban', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: 'Maharashtra', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '400053' })
  @IsString()
  @IsOptional()
  pickup_pincode?: string;

  @ApiProperty({ example: 19.0760, description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 72.8777, description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'LAPTOP_COMPUTER', required: false })
  @IsString()
  @IsOptional()
  ai_category?: string;

  @ApiProperty({ example: 'Dell Latitude Core i5', required: false })
  @IsString()
  @IsOptional()
  ai_subcategory?: string;

  @ApiProperty({ example: 0.92, required: false })
  @IsNumber()
  @IsOptional()
  ai_confidence?: number;

  @ApiProperty({ example: 'Laptop Computer', required: false })
  @IsString()
  @IsOptional()
  user_confirmed_category?: string;

  @ApiProperty({ example: 1200.00, required: false })
  @IsNumber()
  @IsOptional()
  estimated_min_value?: number;

  @ApiProperty({ example: 1600.00, required: false })
  @IsNumber()
  @IsOptional()
  estimated_max_value?: number;

  @ApiProperty({ example: 1400.00, required: false })
  @IsNumber()
  @IsOptional()
  estimated_value?: number;

  @ApiProperty({ example: 'INR', required: false })
  @IsString()
  @IsOptional()
  valuation_currency?: string;

  @ApiProperty({ type: [LotImageDto], required: false })
  @IsArray()
  @IsOptional()
  images?: LotImageDto[];
}

