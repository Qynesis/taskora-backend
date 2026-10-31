import { ApiProperty } from '@nestjs/swagger';

export class WebhookProcessedResponseDto {
  @ApiProperty({ example: true })
  received!: boolean;
}
