import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { JobStatus } from "../../../database";


export class UpdateJobStatusDto {
  @ApiProperty({
    enum: JobStatus,
    description: 'New job status. Must be one of the allowed JobStatus values.',
    example: JobStatus.COMPLETED,
  })
  @IsEnum(JobStatus, { message: `status must be a valid JobStatus value` })
  status!: JobStatus;
}
