import { ApiProperty } from '@nestjs/swagger';

export class SkillOptionResponseDto {
  @ApiProperty({ example: 'Carpentry' })
  label!: string;

  @ApiProperty({ example: '6e1b1215-f7cf-44b1-9d87-0d5a8e0108d3' })
  value!: string;
}

export class SkillOptionsPaginatedResponseDto {
  @ApiProperty({ type: SkillOptionResponseDto, isArray: true })
  items!: SkillOptionResponseDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}
