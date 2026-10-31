import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogListItemDto {
  @ApiProperty({ description: 'Display name of the user who performed the action', example: 'Sarah Chen' })
  actorName!: string;

  @ApiPropertyOptional({ description: 'Avatar URL of the actor, if set', example: null, nullable: true })
  actorAvatarUrl!: string | null;

  @ApiProperty({ description: 'Human-readable description of the action', example: 'submitted verification' })
  action!: string;

  @ApiProperty({ description: 'When the action occurred' })
  createdAt!: Date;
}
