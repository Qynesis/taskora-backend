import { PartialType } from '@nestjs/swagger';
import { CreateBankDetailsDto } from './create-bank-details.dto';

export class PatchBankDetailsDto extends PartialType(CreateBankDetailsDto) {}
