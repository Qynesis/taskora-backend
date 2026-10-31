// dto/attach-step-files.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsEnum } from 'class-validator';
import { StorageProvider } from '../../../database/common/enum';

export class AttachStepFileDto {
  @ApiProperty({ example: 'https://cdn.example.com/abn.pdf' })
  @IsUrl({ require_protocol: true })
  url!: string;
}