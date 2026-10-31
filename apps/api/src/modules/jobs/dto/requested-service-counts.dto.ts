import { ApiProperty } from '@nestjs/swagger';

export class RequestedServiceCountsDto {
  @ApiProperty()
  requested!: number;

  @ApiProperty()
  in_progress!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  cancelled!: number;
}
