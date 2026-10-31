import { ApiProperty } from '@nestjs/swagger';

export class MarkReadResponseDto {
  @ApiProperty({ example: true })
  updated!: boolean;
}
