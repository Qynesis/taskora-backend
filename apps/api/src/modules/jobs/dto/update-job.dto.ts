import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

/**
 * Every CreateJobDto field, all optional so the client only sends what changed.
 *
 * The budget terms (budgetPrice, budgetPeriod) are accepted here, but JobService.update
 * rejects them once any provider has bid — bidders price against the budget, so it must not
 * move under them. Before the first bid the seeker can still correct a mistyped budget.
 */
export class UpdateJobDto extends PartialType(CreateJobDto) {}
