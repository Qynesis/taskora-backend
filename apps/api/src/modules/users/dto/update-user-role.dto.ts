import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../database/common/enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: [UserRole.SEEKER, UserRole.PROVIDER],
    description: 'The role to switch to — only SEEKER or PROVIDER is allowed',
  })
  @IsEnum([UserRole.SEEKER, UserRole.PROVIDER])
  role!: UserRole.SEEKER | UserRole.PROVIDER;
}
