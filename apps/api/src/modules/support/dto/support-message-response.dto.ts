import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportSenderType } from '../../../database/common/enum';

export class SupportMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SupportSenderType })
  senderType!: SupportSenderType;

  @ApiProperty()
  senderName!: string;

  @ApiPropertyOptional({ nullable: true })
  senderAvatarUrl!: string | null;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  attachments!: string[] | null;

  @ApiProperty()
  createdAt!: string;
}
