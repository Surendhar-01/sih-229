import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
  @ApiProperty({ example: 'Ramesh Babu' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'ramesh@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'en', enum: ['en', 'hi', 'mr'] })
  @IsString()
  @IsIn(['en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn'])
  preferred_language: string;

  @ApiProperty({ example: 'Dharavi, Mumbai' })
  @IsString()
  @IsNotEmpty()
  general_location: string;

  @ApiProperty({
    example: 'USER',
    enum: ['USER', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER'],
    description: 'Requested role. GOVERNMENT_ADMIN registration is prohibited.',
  })
  @IsString()
  @IsIn(['USER', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER'])
  role: string;

  @ApiProperty({ example: 'Babu Scrap Godown', required: false })
  @IsString()
  @IsOptional()
  business_name?: string;

  @ApiProperty({ example: 'AUTO_RICKSHAW', required: false })
  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @ApiProperty({ example: 'CPCB/EW-REG/MH-2023/401', required: false })
  @IsString()
  @IsOptional()
  cpcb_authorization_number?: string;
}
