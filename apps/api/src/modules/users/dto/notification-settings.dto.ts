import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Receive notifications via email' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive alerts for new messages' })
  @IsOptional()
  @IsBoolean()
  messageAlertsEnabled?: boolean;
}

export class UpdateNotificationSettingsResponseDto {
  @ApiProperty({ example: 'f8d4f3a9-01e8-4cf0-bf17-3b98a4f8db5d', description: 'Notification settings record id' })
  id!: string;
}
