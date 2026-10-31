import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarningSenderType } from '../../../database/common/enum';

export class WarningMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WarningSenderType })
  senderType!: WarningSenderType;

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
