import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkInfoResponseDto {
  @ApiProperty({ example: 'f2f41d6a-23d1-45ae-ab3f-6c2452fbe2a8' })
  profileId!: string;

  @ApiProperty({ example: 'ABC Plumbing Pty Ltd' })
  businessName!: string;

  @ApiProperty({ example: '12345678901' })
  abn!: string;

  @ApiPropertyOptional({ example: '123456789', nullable: true })
  acn?: string | null;

}
