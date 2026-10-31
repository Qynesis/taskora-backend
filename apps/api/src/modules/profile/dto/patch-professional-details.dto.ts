import { PartialType } from '@nestjs/swagger';
import { UpdateProfessionalDetailsDto } from './update-professional-details.dto';

export class PatchProfessionalDetailsDto extends PartialType(UpdateProfessionalDetailsDto) {}
