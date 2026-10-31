// dto/res/verification-case.res.dto.ts
import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { CitizenDocumentType, IdentityType, RejectionReason, RightToWorkStatus, VerificationStatus, VerificationStepType } from '../../../../database/common/enum';

export class VerificationStepFileResDto {
    @ApiProperty({ example: 'https://cdn.example.com/doc.pdf' })
    fileUrl!: string;

    @ApiPropertyOptional({ example: 'passport', description: 'passport | vevo_check — only set for VISA right-to-work files' })
    label?: string | null;
}

// ── Common fields ─────────────────────────────────────────────────────────────

export class BaseVerificationStepResDto {
    @ApiProperty({ description: 'Step UUID — used by admin to approve/reject this step' })
    id!: string;

    @ApiProperty({ enum: VerificationStepType })
    stepType!: VerificationStepType;

    @ApiProperty({ enum: VerificationStatus })
    status!: VerificationStatus;

    @ApiPropertyOptional({ enum: RejectionReason })
    rejectionReason?: RejectionReason | null;

    @ApiPropertyOptional()
    rejectionNote?: string | null;
}

// ── Step 1: Business ─────────────────────────────────────────────────────────

export class BusinessStepResDto extends BaseVerificationStepResDto {
    @ApiProperty({ example: '12345678901', nullable: true })
    abn!: string | null;

    @ApiProperty({ type: () => VerificationStepFileResDto, nullable: true })
    file!: VerificationStepFileResDto | null;
}

// ── Step 2: Identity ─────────────────────────────────────────────────────────

export class IdentityStepResDto extends BaseVerificationStepResDto {
    @ApiProperty({ enum: IdentityType, nullable: true })
    identityType!: IdentityType | null;

    @ApiProperty({
        type: () => [VerificationStepFileResDto],
        description: 'One file (front) for PASSPORT, two (front + back) for DRIVING_LICENSE',
    })
    files!: VerificationStepFileResDto[];
}

// ── Step 3: Right to Work ────────────────────────────────────────────────────

export class RightToWorkStepResDto extends BaseVerificationStepResDto {
    @ApiProperty({ enum: RightToWorkStatus, nullable: true })
    rightToWorkStatus!: RightToWorkStatus | null;

    @ApiPropertyOptional({ enum: CitizenDocumentType, description: 'Set when rightToWorkStatus is CITIZEN_PR' })
    citizenDocumentType?: CitizenDocumentType | null;

    @ApiProperty({ type: () => [VerificationStepFileResDto], description: 'One file for CITIZEN_PR, two (passport + vevo_check) for VISA' })
    files!: VerificationStepFileResDto[];
}

// ── Step 4: Police Check ─────────────────────────────────────────────────────

export class PoliceCheckStepResDto extends BaseVerificationStepResDto {
    @ApiPropertyOptional({ example: 'NCC-REF-2025-0001' })
    policeRefNo?: string | null;

    @ApiProperty({ type: () => VerificationStepFileResDto, nullable: true })
    file!: VerificationStepFileResDto | null;
}

// ── Step 5: Selfie (Stripe Identity) ─────────────────────────────────────────

export class SelfieStepResDto extends BaseVerificationStepResDto {
    // No file — Stripe Identity handles verification externally
}

// ── Union type ────────────────────────────────────────────────────────────────

export type VerificationStepResDto =
    | BusinessStepResDto
    | IdentityStepResDto
    | RightToWorkStepResDto
    | PoliceCheckStepResDto
    | SelfieStepResDto;

export const ALL_STEP_RES_DTOS = [
    BusinessStepResDto,
    IdentityStepResDto,
    RightToWorkStepResDto,
    PoliceCheckStepResDto,
    SelfieStepResDto,
];

// ── Case ──────────────────────────────────────────────────────────────────────

export class VerificationCaseResDto {
    @ApiProperty({ enum: VerificationStatus })
    status!: VerificationStatus;

    @ApiProperty({
        description: 'One entry per submitted step. Shape varies by stepType.',
        type: 'array',
        items: {
            oneOf: [
                { $ref: getSchemaPath(BusinessStepResDto) },
                { $ref: getSchemaPath(IdentityStepResDto) },
                { $ref: getSchemaPath(RightToWorkStepResDto) },
                { $ref: getSchemaPath(PoliceCheckStepResDto) },
                { $ref: getSchemaPath(SelfieStepResDto) },
            ],
        },
    })
    steps!: VerificationStepResDto[];
}
