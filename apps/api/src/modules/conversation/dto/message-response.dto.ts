import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentDto } from '../../../interfaces/attachment.dto';

export class JobPreviewDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() budgetPrice?: number | null;
  @ApiPropertyOptional() locationText?: string | null;
  @ApiPropertyOptional() category?: { id: string; name: string } | null;
}

export class MessageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() senderId!: string;
  @ApiProperty() senderName!: string;
  @ApiPropertyOptional() senderAvatarUrl!: string | null;
  @ApiProperty() body!: string;
  @ApiProperty() isRead!: boolean;
  @ApiPropertyOptional({ type: () => JobPreviewDto }) jobPreview!: JobPreviewDto | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: [AttachmentDto] }) attachments!: AttachmentDto[];
}
