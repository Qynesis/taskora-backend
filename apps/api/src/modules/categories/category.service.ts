import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CategoryAsset, CategoryAssetType } from '../../database/entities/category-asset.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryAssetsResponseDto } from './dto/category-option-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { CategoryCreatedEvent } from './events/category-created.event';

type SelectOptionDto = {
  label: string;
  value: string;
};

/**
 * Client-curated featured categories for GET /categories/names?featured=true, in the fixed display
 * order the client asked for. These are the REAL seed category names (see seed-categories.ts), not
 * the client's shorthand — the client's list said "Electrician", "Removals", "Pest controls" and
 * "Cleaning", which map to the entries below. Matched by name because category IDs are generated at
 * seed time and differ per environment, so the name is the only stable key across QA/prod.
 */
const FEATURED_CATEGORY_NAMES = [
  'Plumbing',
  'Handyman',
  'Electricians',
  'Building & Renovations',
  'Carpentry',
  'Domestic Cleaning',
  'Removalists (Transport)',
  'Pest Control',
] as const;

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CategoryAsset)
    private readonly categoryAssetRepository: Repository<CategoryAsset>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const entity = await this.txHelper.run(async (qr) => {
      const record = this.categoryRepository.create(dto as any) as unknown as Category;
      return await qr.manager.save(record);
    });

    this.eventEmitter.emit(new CategoryCreatedEvent(entity.id, (entity as any).name ?? ''));

    return entity;
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedResponseDto<SelectOptionDto>> {
    const options = paginateQuery<Category>(query);
    const [data, total] = await this.categoryRepository.findAndCount(options);
    const items = data.map((category) => ({ label: category.name, value: category.id }));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findNames(query: CategoryQueryDto): Promise<PaginatedResponseDto<{ value: string; level: string; icon: string | null }>> {
    if (query.featured) {
      return this.findFeaturedNames(query);
    }

    const { skip, take } = paginateQuery<Category>(query);
    const qb = this.categoryRepository.createQueryBuilder('c')
      .select(['c.id', 'c.name', 'c.iconUrl'])
      .orderBy('c.name', 'ASC')
      .skip(skip)
      .take(take);

    if (query.search) {
      qb.where('c.name ILIKE :search', { search: `%${query.search}%` });
    }

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map((c) => ({ value: c.id, level: c.name, icon: c.iconUrl ?? null }));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  /**
   * Featured set: only FEATURED_CATEGORY_NAMES, returned in that fixed order (not alphabetically),
   * ignoring search and pagination. A configured name that isn't in the DB is simply skipped rather
   * than surfaced as an empty slot, so the response only ever contains real categories.
   */
  private async findFeaturedNames(
    query: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<{ value: string; level: string; icon: string | null }>> {
    const rows = await this.categoryRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.name', 'c.iconUrl'])
      .where('c.name IN (:...names)', { names: FEATURED_CATEGORY_NAMES })
      .getMany();

    const byName = new Map(rows.map((c) => [c.name, c]));
    const items = FEATURED_CATEGORY_NAMES.map((name) => byName.get(name))
      .filter((c): c is Category => c != null)
      .map((c) => ({ value: c.id, level: c.name, icon: c.iconUrl ?? null }));

    return new PaginatedResponseDto(items, items.length, query.page, query.limit);
  }

  async findAssets(categoryId: string): Promise<CategoryAssetsResponseDto> {
    const assets = await this.categoryAssetRepository.findBy({ categoryId } as any);
    return {
      cover: assets.find((a) => a.type === CategoryAssetType.COVER)?.url ?? null,
      subCover: assets.find((a) => a.type === CategoryAssetType.SUB_COVER)?.url ?? null,
    };
  }

  // Don't need
  /*async findOne(id: string): Promise<Category> {
    const record = await this.categoryRepository.findOneBy({ id } as any);
    if (!record) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return await this.categoryRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.categoryRepository.softRemove(record);
  }*/
}
