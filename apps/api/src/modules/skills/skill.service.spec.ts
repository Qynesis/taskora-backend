import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { SkillService } from './skill.service';
import { Skill } from '../../database/entities/skill.entity';
import { createMockRepository } from '../../../test/helpers/test-factory';

describe('SkillService', () => {
  let module: TestingModule;
  let service: SkillService;
  let skillRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    skillRepo = createMockRepository();

    module = await Test.createTestingModule({
      providers: [
        SkillService,
        { provide: getRepositoryToken(Skill), useValue: skillRepo },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and save a skill', async () => {
    const dto = { name: 'Cleaning' } as any;
    const created = { id: 'skill-1', ...dto };
    skillRepo.create.mockReturnValue(created);
    skillRepo.save.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(skillRepo.create).toHaveBeenCalledWith(dto);
    expect(skillRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('should return paginated skills', async () => {
    const query = { page: 1, limit: 10 } as any;
    const rows = [{ id: 'skill-1', name: 'Cleaning' }];
    skillRepo.findAndCount.mockResolvedValue([rows, 1]);

    const result = await service.findAll(query);

    expect(skillRepo.findAndCount).toHaveBeenCalled();
    expect(result.items).toEqual([{ label: 'Cleaning', value: 'skill-1' }]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should apply a case-insensitive name filter when search is provided', async () => {
    const query = { page: 1, limit: 10, search: 'clean' } as any;
    skillRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(query);

    expect(skillRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: ILike('%clean%') } }),
    );
  });

  it('should NOT add a where clause when search is empty/whitespace', async () => {
    const query = { page: 1, limit: 10, search: '   ' } as any;
    skillRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(query);

    expect(skillRepo.findAndCount).toHaveBeenCalledWith(
      expect.not.objectContaining({ where: expect.anything() }),
    );
  });
});