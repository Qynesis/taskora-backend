import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty({ example: true })
  pong!: boolean;

  @ApiProperty({ example: '2026-04-09T10:15:30.000Z' })
  timestamp!: string;
}

export class ResolvedUserDto {
  @ApiProperty({ example: '2d5f9b52-c0a2-4a2e-a9f4-4a6f0f2294a2' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ type: [String], example: ['SEEKER'] })
  roles!: string[];

  @ApiProperty({ type: Object, example: { tenant: 'aus' } })
  metadata!: Record<string, unknown>;
}

export class EchoResponseDto {
  @ApiProperty({ type: Object, example: { message: 'hello world', data: { key: 'value' } } })
  received!: Record<string, unknown>;

  @ApiProperty({ type: () => ResolvedUserDto })
  resolvedUser!: ResolvedUserDto;

  @ApiProperty({ example: '2026-04-09T10:15:30.000Z' })
  timestamp!: string;
}
