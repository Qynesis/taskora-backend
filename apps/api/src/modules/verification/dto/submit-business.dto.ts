import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, Matches, IsOptional, IsUrl } from 'class-validator';

export class SubmitBusinessDto {
  @ApiProperty({ example: '12345678901', description: 'Australian Business Number' })
  @IsString()
  @Length(9, 20)
  @Matches(/^\d+$/, { message: 'ABN must contain digits only' })
  abn!: string;

  @ApiProperty({ example: 'https://cdn.example.com/abn.pdf' })
  @IsUrl({ require_protocol: true })
  fileUrl!: string;
}