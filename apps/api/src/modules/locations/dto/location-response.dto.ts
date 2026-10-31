import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../interfaces/paginated-response.dto';

export class LocationOptionDto {
  @ApiProperty({ format: 'uuid' })
  value!: string;

  @ApiProperty({ example: 'New South Wales' })
  label!: string;
}

export class PaginatedStatesResponseDto extends PaginatedResponseDto<LocationOptionDto> {
  @ApiProperty({ type: [LocationOptionDto] })
  declare items: LocationOptionDto[];
}

/**
 * A suburb name is not unique within a state — "Back Creek" is six distinct NSW localities,
 * "Mayfield" four — so the postcode is what tells them apart. Clients should show it
 * alongside the label wherever more than one option shares a name.
 */
export class SuburbOptionDto extends LocationOptionDto {
  @ApiProperty({ example: '2026', nullable: true, description: '4-digit Australian postcode' })
  postcode!: string | null;
}

export class PaginatedSuburbsResponseDto extends PaginatedResponseDto<SuburbOptionDto> {
  @ApiProperty({ type: [SuburbOptionDto] })
  declare items: SuburbOptionDto[];
}
