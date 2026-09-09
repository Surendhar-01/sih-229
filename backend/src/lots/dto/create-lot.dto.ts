import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLotDto {
  @ApiProperty({ example: 1, description: 'Material category ID' })
  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @ApiProperty({ example: 1, description: 'Specific material ID', required: false })
  @IsNumber()
  @IsOptional()
  material_id?: number;

  @ApiProperty({ example: 'Old 21 inch CRT television, intact casing' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'INTACT', enum: ['INTACT', 'PARTIAL_DISASSEMBLED', 'DAMAGED_CRUSHED', 'SCRAP_BURNT'] })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({ example: 18.5, description: 'Estimated weight in kg' })
  @IsNumber()
  @IsOptional()
  estimated_weight_kg?: number;

  @ApiProperty({ example: 'Flat 402, Green Valley Apartments, Mumbai' })
  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @IsOptional()
  pickup_pincode?: string;

  @ApiProperty({ example: 19.0760, description: 'Latitude' })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: 72.8777, description: 'Longitude' })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ example: 350.00, required: false })
  @IsNumber()
  @IsOptional()
  ai_estimated_min_value?: number;

  @ApiProperty({ example: 450.00, required: false })
  @IsNumber()
  @IsOptional()
  ai_estimated_max_value?: number;
}
