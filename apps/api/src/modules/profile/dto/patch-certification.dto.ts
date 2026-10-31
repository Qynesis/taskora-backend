import { PartialType } from '@nestjs/swagger';
import { CreateCertificationDto } from './create-certification.dto';

export class PatchCertificationDto extends PartialType(CreateCertificationDto) {}
