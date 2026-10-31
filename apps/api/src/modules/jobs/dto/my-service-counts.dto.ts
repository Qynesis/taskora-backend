import { ApiProperty } from '@nestjs/swagger';

export class MyServiceCountsDto {
  @ApiProperty({ description: 'Jobs selected by the seeker but not yet started' })
  to_do!: number;

  @ApiProperty()
  in_progress!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty({ description: 'Jobs cancelled by the seeker' })
  cancelled!: number;
}
