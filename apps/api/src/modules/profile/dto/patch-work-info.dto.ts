import { PartialType } from '@nestjs/swagger';
import { UpdateWorkInfoDto } from './update-work-info.dto';

export class PatchWorkInfoDto extends PartialType(UpdateWorkInfoDto) {}
