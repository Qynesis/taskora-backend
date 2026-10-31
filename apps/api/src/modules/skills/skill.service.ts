import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Skill } from '../../database/entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillQueryDto } from './dto/skill-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';

type SelectOptionDto = {
  label: string;
  value: string;
};

@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateSkillDto): Promise<Skill> {
    const record = this.skillRepository.create(dto as any) as unknown as Skill;
    return this.skillRepository.save(record);
  }

  async findAll(query: SkillQueryDto): Promise<PaginatedResponseDto<SelectOptionDto>> {
    const options = paginateQuery<Skill>(query);
    const search = query.search?.trim();
    const [data, total] = await this.skillRepository.findAndCount({
      ...options,
      ...(search ? { where: { name: ILike(`%${search}%`) } } : {}),
    });
    const items = data.map((skill) => ({ label: skill.name, value: skill.id }));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }
}
