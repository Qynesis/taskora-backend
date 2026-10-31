import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWarningAdminDto {
  @ApiProperty({ description: 'Warning message to deliver to the user inbox' })
  @IsString()
  @MinLength(10)
  warningMessage!: string;
}
