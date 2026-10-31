import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkInfoDto {
  @ApiProperty({ example: 'HandyPro Services' })
  @IsString() @MaxLength(200)
  businessName!: string;

  @ApiProperty({ example: '12345678901' })
  @IsString() @MaxLength(20)
  abn!: string;

  @ApiPropertyOptional({ example: '10154803' })
  @IsOptional() @IsString() @MaxLength(20)
  acn?: string;
}
