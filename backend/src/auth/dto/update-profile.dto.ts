import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ramesh Babu', required: false })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ example: 'hi', enum: ['en', 'hi', 'mr'], required: false })
  @IsString()
  @IsOptional()
  @IsIn(['en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn'])
  preferred_language?: string;

  @ApiProperty({ example: 'Andheri West, Mumbai', required: false })
  @IsString()
  @IsOptional()
  general_location?: string;

  @ApiProperty({ example: 'https://cdn.example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatar_url?: string;
}
