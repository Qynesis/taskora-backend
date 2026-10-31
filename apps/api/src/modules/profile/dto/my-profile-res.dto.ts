import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyProfileResDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Owning user id' })
  user_id!: string;

  @ApiProperty({ example: 'Saif', nullable: true })
  firstName?: string;

  @ApiProperty({ example: 'Bashar', nullable: true })
  lastName?: string;

  @ApiProperty({ example: '+61411643974', nullable: true })
  phone?: string;

  @ApiProperty({ example: false, description: 'Whether the phone number has been verified via OTP' })
  phoneVerified!: boolean;

  @ApiProperty({ example: 'https://cdn.example.com/avatar.jpg', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ example: '1988-04-23', nullable: true })
  date_of_birth?: string;

  @ApiProperty({ example: 'Unit 9, 161 Princes Highway', nullable: true })
  streetAddress?: string;

  @ApiProperty({ example: 'Kogarah', nullable: true })
  suburb?: string;

  @ApiProperty({ example: 'NSW', nullable: true })
  state?: string;

  @ApiProperty({ example: '2217', nullable: true })
  postcode?: string;

  @ApiProperty({ example: 'AU', nullable: true })
  country?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Provider only. true once an admin approves the IDENTITY verification step — the name and ' +
      'date of birth are then frozen (KYC-verified against the ID document / Stripe) and cannot be ' +
      'edited. Omitted entirely for seekers.',
  })
  locked?: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
