import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarningSenderType } from '../../../database/common/enum';

export class WarningThreadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reportRef!: string;

  @ApiProperty()
  suspensionDeadline!: string;

  @ApiProperty()
  isClosed!: boolean;

  @ApiProperty()
  recipientName!: string;

  @ApiPropertyOptional({ nullable: true })
  recipientAvatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessageBody!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessageAt!: string | null;

  @ApiPropertyOptional({ enum: WarningSenderType, nullable: true })
  lastMessageSenderType!: WarningSenderType | null;

  @ApiProperty()
  createdAt!: string;
}
