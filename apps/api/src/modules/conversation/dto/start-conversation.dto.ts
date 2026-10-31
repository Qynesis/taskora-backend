import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ description: 'UUID of the other user (seeker or provider)' })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ description: 'Optional job reference — renders as a preview card' })
  @IsOptional()
  @IsUUID()
  jobId?: string;
}
