import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuspendUserDto {
  @ApiProperty({ description: 'Report ID that triggered this suspension' })
  @IsUUID()
  reportId!: string;
}
