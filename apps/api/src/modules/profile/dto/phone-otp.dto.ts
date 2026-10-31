import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '123456', description: '6-digit OTP sent to the phone' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class PhoneVerifiedResDto {
  @ApiProperty()
  phoneVerified!: boolean;
}
