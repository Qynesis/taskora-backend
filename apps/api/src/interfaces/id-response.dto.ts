import { ApiProperty } from '@nestjs/swagger';

export class IdResponseDto {
  @ApiProperty({ example: '7b7c4f73-e0a9-44ba-9532-9bb307a4c70e' })
  id!: string;
}