import { IsString, MinLength, MaxLength, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({ minLength: 10, maxLength: 300 })
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  subject!: string;

  @ApiProperty({ description: 'First message content' })
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ type: [String], description: 'List of uploaded file URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];
}
