import { ApiProperty } from '@nestjs/swagger';

export class ConversationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'The other party\'s avatar URL', nullable: true })
  otherUserAvatar!: string | null;

  @ApiProperty({ description: 'The other party\'s display name' })
  otherUserName!: string;

  @ApiProperty({ description: 'Last message body', nullable: true })
  lastMessage!: string | null;

  @ApiProperty({ description: 'ISO timestamp of the last message', nullable: true })
  lastMessageAt!: string | null;

  @ApiProperty({
    description: 'Human-readable relative time label (e.g. "2 hours ago", "Mon", "12 Jan")',
    nullable: true,
  })
  lastMessageLabel!: string | null;

  @ApiProperty({ description: 'Conversation created at ISO timestamp' })
  createdAt!: string;
}
