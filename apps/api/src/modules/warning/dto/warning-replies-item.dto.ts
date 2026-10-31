import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarningRepliesItemDto {
  @ApiProperty()
  threadId!: string;

  @ApiProperty()
  reportRef!: string;

  @ApiProperty()
  recipientName!: string;

  @ApiPropertyOptional({ nullable: true })
  recipientAvatarUrl!: string | null;

  @ApiProperty()
  lastUserMessageSnippet!: string;

  @ApiProperty()
  lastUserMessageAt!: string;

  @ApiProperty()
  isClosed!: boolean;
}
