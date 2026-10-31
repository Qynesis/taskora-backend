import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';
import { RefundRequestStatus } from '../../../database/common/enum';

export class ProviderRefundRequestQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: RefundRequestStatus, description: 'Filter by refund request status' })
  @IsOptional()
  @IsEnum(RefundRequestStatus)
  status?: RefundRequestStatus;
}
