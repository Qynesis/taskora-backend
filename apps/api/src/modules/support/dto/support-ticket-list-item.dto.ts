import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportSenderType } from '../../../database/common/enum';

export class SupportTicketListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  senderName!: string;

  @ApiPropertyOptional({ nullable: true })
  senderAvatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessageBody!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessageAt!: string | null;

  @ApiPropertyOptional({ enum: SupportSenderType, nullable: true })
  lastMessageSenderType!: SupportSenderType | null;

  @ApiProperty()
  createdAt!: string;
}
