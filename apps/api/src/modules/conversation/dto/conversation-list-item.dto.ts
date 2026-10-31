import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OtherParticipantDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() avatarUrl!: string | null;
  @ApiProperty() role!: string;
  @ApiProperty({ description: 'True when this participant has deleted their account; the client should disable the composer.' })
  isDeleted!: boolean;
}

export class LastMessagePreviewDto {
  @ApiProperty() body!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() isFromMe!: boolean;
}

export class ConversationListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty({ type: () => OtherParticipantDto }) otherParticipant!: OtherParticipantDto;
  @ApiPropertyOptional({ type: () => LastMessagePreviewDto }) lastMessage!: LastMessagePreviewDto | null;
  @ApiProperty() unreadCount!: number;
}
