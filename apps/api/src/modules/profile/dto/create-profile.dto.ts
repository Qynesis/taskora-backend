import { IsString, IsOptional, IsUrl, MaxLength, IsISO31661Alpha2, IsDateString, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export class CreateProfileDto {
  @ApiProperty({ example: 'John' })
  @IsString() @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString() @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    example: '+61412345678',
    description: 'Australian phone number. Accepts local (04xx xxx xxx) or international form; stored as E.164 (+61…).',
  })
  // Normalise to E.164 before validation so whatever the client sends — spaces, a leading 0, or a
  // full +61 — lands in the column as one canonical form. That string is dialled verbatim by the
  // SMS provider in sendPhoneOtp, so an un-normalised number is a silently undeliverable OTP.
  // 'AU' is the default region: a leading-0 local number is read as Australian. If parsing fails
  // the raw value is passed through unchanged so @IsPhoneNumber rejects it with a clear message.
  @Transform(({ value }) =>
    typeof value === 'string'
      ? (parsePhoneNumberFromString(value, 'AU')?.number ?? value.trim())
      : value,
  )
  @IsPhoneNumber('AU')
  phone!: string;

  @ApiPropertyOptional({ example: 'https://cdn.com/a.jpg' })
  @IsOptional() @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString() @MaxLength(200)
  streetAddress!: string;

  @ApiProperty({ example: 'Surry Hills' })
  @IsString() @MaxLength(100)
  suburb!: string;

  @ApiProperty({ example: 'NSW' })
  @IsString() @MaxLength(50)
  state!: string;

  @ApiProperty({ example: '2000' })
  @IsString() @MaxLength(10)
  postcode!: string;

  @ApiProperty({ example: 'AU' })
  @IsISO31661Alpha2()
  country!: string;
}
