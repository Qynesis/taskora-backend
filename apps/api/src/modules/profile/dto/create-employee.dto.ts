import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString() @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Senior Technician' })
  @IsString() @MaxLength(150)
  designation!: string;

  @ApiPropertyOptional({ example: 'https://cdn.com/jane.jpg' })
  @IsOptional() @IsUrl()
  avatarUrl?: string;
}
