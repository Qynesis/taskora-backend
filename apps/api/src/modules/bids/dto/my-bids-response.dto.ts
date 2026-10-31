import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Bid } from '../../../database/entities/bid.entity';
import { BidStatus } from '../../../database/common/enum';
import { money } from '../../../interfaces/money.util';

export class MyBidJobDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  jobRef?: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  budgetPrice?: number | null;

  @ApiPropertyOptional()
  locationText?: string | null;

  @ApiPropertyOptional()
  category?: { id: string; name: string } | null;

  @ApiProperty()
  createdAt!: Date;
}

export class MyBidsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['bidding', 'accepted', 'declined'] })
  status!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  seekerName!: string;

  @ApiProperty({ type: () => MyBidJobDto })
  job!: MyBidJobDto;

  static from(bid: Bid, seekerName: string): MyBidsResponseDto {
    const dto = new MyBidsResponseDto();
    dto.id = bid.id;
    dto.status = bid.status === BidStatus.SUBMITTED ? 'bidding' : bid.status;
    dto.price = money(bid.price);
    dto.currency = bid.currency;
    dto.createdAt = bid.createdAt as unknown as Date;
    dto.updatedAt = bid.updatedAt as unknown as Date;
    dto.seekerName = seekerName;

    const j = bid.job;
    const jobDto = new MyBidJobDto();
    jobDto.id = j.id;
    jobDto.jobRef = j.jobRef;
    jobDto.title = j.title ?? '';
    jobDto.description = j.description ?? null;
    jobDto.budgetPrice = j.totalBudget ?? null;
    jobDto.locationText = j.locationText ?? null;
    jobDto.category = j.category ? { id: j.category.id, name: j.category.name } : null;
    jobDto.createdAt = j.createdAt as unknown as Date;

    dto.job = jobDto;
    return dto;
  }
}
