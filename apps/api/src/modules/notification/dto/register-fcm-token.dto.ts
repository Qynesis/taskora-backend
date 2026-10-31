import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FcmPlatform } from '../../../database/common/enum';

export class RegisterFcmTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({ enum: FcmPlatform })
  @IsOptional()
  @IsEnum(FcmPlatform)
  platform?: FcmPlatform;
}
