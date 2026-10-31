import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsString, ValidateNested } from "class-validator";

export class StatsDto{
    @ApiProperty({description: "Provider numbers"})
    @IsInt()
    provider!: number;

    @ApiProperty({description: "Seeker numbers"})
    @IsInt()
    seeker!: number;

    @ApiProperty({description: "Total numbers"})
    @IsInt()
    total!: number;
}

export class VerificationSummaryDto {
    @ApiProperty({description: "Total number of provider verification cases"})
    @IsInt()
    total!: number;

    @ApiProperty({description: "Number of verification cases awaiting review (pending or submitted)"})
    @IsInt()
    pending!: number;

    @ApiProperty({description: "Number of approved verification cases"})
    @IsInt()
    verified!: number;
}

export class DashboardSummaryDto {
    @ApiProperty({description: "User stats"})
    @ValidateNested()
    @Type(() => StatsDto)
    user!: StatsDto;

    @ApiProperty({description: "Job stats"})
    @ValidateNested()
    @Type(() => StatsDto)
    jobs!: StatsDto;

    @ApiProperty({description: "Revenue stats"})
    @ValidateNested()
    @Type(() => StatsDto)
    revenue!: StatsDto;

    @ApiProperty({description: "Currency of the revenue figures", example: "AUD"})
    @IsString()
    currency!: string;

    @ApiProperty({description: "Provider verification case stats"})
    @ValidateNested()
    @Type(() => VerificationSummaryDto)
    pending_verifications!: VerificationSummaryDto;
}