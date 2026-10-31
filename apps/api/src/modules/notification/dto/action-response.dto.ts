import { ApiProperty } from '@nestjs/swagger';

export class NotificationActionResponseDto {
  @ApiProperty({ example: true })
  completed!: boolean;
}
