import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../../../database/entities/notification.entity';
import { NotificationType } from '../../../database/common/enum';

export class NotificationResponseDto {
  @ApiProperty({ example: '8b1c9f2a-3d4e-4a5b-9c6d-7e8f9a0b1c2d' }) id!: string;
  @ApiProperty({ example: 'Verification submitted' }) title!: string;
  @ApiProperty({ example: 'John Doe submitted their identity verification for review.' }) body!: string;
  @ApiProperty({ enum: NotificationType, example: NotificationType.VERIFICATION_SUBMITTED }) type!: NotificationType;
  @ApiProperty({ nullable: true, example: { profileId: '…', stepType: 'IDENTITY' } }) data!: Record<string, unknown> | null;
  @ApiProperty({ nullable: true, example: null }) readAt!: string | null;
  @ApiProperty({ nullable: true, example: '2026-08-21T04:15:31.000Z' }) sentAt!: string | null;
  @ApiProperty({ example: '2026-08-21T04:15:30.000Z' }) createdAt!: string;

  static from(n: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = n.id;
    dto.title = n.title;
    dto.body = n.body;
    dto.type = n.type;
    dto.data = n.data;
    dto.readAt = n.readAt?.toISOString() ?? null;
    dto.sentAt = n.sentAt?.toISOString() ?? null;
    dto.createdAt = n.createdAt.toISOString();
    return dto;
  }
}
