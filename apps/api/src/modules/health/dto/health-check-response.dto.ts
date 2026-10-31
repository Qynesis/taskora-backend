import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ type: Object })
  info!: Record<string, unknown>;

  @ApiProperty({ type: Object })
  error!: Record<string, unknown>;

  @ApiProperty({ type: Object })
  details!: Record<string, unknown>;
}
