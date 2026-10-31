import { ApiProperty } from '@nestjs/swagger';

export class ReportableUserDto {
    @ApiProperty({ description: "User's full name (firstName + lastName), falls back to email" })
    label!: string;

    @ApiProperty({ description: 'User UUID — use as the subjectUserId when submitting a report' })
    value!: string;
}
