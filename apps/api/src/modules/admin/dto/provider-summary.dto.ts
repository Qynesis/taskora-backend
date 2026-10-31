import { ApiProperty } from '@nestjs/swagger';

export class ProviderSummaryDto {
  @ApiProperty({ description: 'Provider user UUID' })
  id!: string;

  @ApiProperty({ description: 'Full name or business name', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Service categories the provider belongs to', type: String, isArray: true })
  categories!: string[];

  @ApiProperty({ description: 'When the provider submitted their verification case (ISO 8601)', nullable: true })
  submissionDate!: string | null;
}
