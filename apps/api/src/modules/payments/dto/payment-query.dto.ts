import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export enum ProviderPaymentStatusFilter {
  PAID = 'paid',
  PENDING = 'pending',
  REFUNDED = 'refunded',
}

export class PaymentQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: ProviderPaymentStatusFilter, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(ProviderPaymentStatusFilter)
  status?: ProviderPaymentStatusFilter;
}
