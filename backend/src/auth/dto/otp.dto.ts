import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543212', description: 'User mobile number with country code' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'COLLECTION_COLLECTOR', description: 'Platform target role' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543212', description: 'User mobile number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP verification code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 numeric digits' })
  otp: string;

  @ApiProperty({ example: 'COLLECTION_COLLECTOR', description: 'Target platform role' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: '+919876543212', description: 'User mobile number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'COLLECTION_COLLECTOR', description: 'Target platform role' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class GoogleAuthSyncDto {
  @ApiProperty({ description: 'Supabase Auth User ID' })
  @IsNotEmpty()
  @IsString()
  supabase_user_id: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Ramesh Babu', required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ example: 'COLLECTION_COLLECTOR' })
  @IsNotEmpty()
  @IsString()
  role: string;
}
