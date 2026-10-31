import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export class SupportTicketQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by subject or sender name' })
  @IsOptional()
  @IsString()
  search?: string;
}
