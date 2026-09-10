import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'user@example.com or +919876543210' })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'COLLECTION_COLLECTOR' })
  @IsString()
  @IsIn(['USER', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER', 'GOVERNMENT_ADMIN'])
  role: string;
}
