import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../../database/entities/state.entity';
import { Suburb } from '../../database/entities/suburb.entity';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { LocationQueryDto, SuburbQueryDto } from './dto/location-query.dto';
import { LocationOptionDto, SuburbOptionDto } from './dto/location-response.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(Suburb)
    private readonly suburbRepository: Repository<Suburb>,
  ) {}

  async findStates(query: LocationQueryDto): Promise<PaginatedResponseDto<LocationOptionDto>> {
    const qb = this.stateRepository
      .createQueryBuilder('s')
      .select(['s.id', 's.name'])
      .orderBy('s.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.search) {
      qb.where('s.name ILIKE :search OR s.code ILIKE :search', { search: `%${query.search}%` });
    }

    const [rows, total] = await qb.getManyAndCount();
    const items: LocationOptionDto[] = rows.map((s) => ({ value: s.id, label: s.name }));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findSuburbs(query: SuburbQueryDto): Promise<PaginatedResponseDto<SuburbOptionDto>> {
    const qb = this.suburbRepository
      .createQueryBuilder('s')
      .select(['s.id', 's.name', 's.postcode'])
      // Names repeat within a state (six NSW "Back Creek"s), so postcode is the tiebreak
      // that keeps paging stable rather than leaving equal-name rows in arbitrary order.
      .orderBy('s.name', 'ASC')
      .addOrderBy('s.postcode', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.stateId) {
      qb.where('s.state_id = :stateId', { stateId: query.stateId });
    }

    if (query.search) {
      // Matches either the name or the postcode, so typing "2026" finds Bondi.
      qb.andWhere('(s.name ILIKE :search OR s.postcode LIKE :pcSearch)', {
        search: `%${query.search}%`,
        pcSearch: `${query.search}%`,
      });
    }

    const [rows, total] = await qb.getManyAndCount();
    const items: SuburbOptionDto[] = rows.map((s) => ({
      value: s.id,
      label: s.name,
      postcode: s.postcode ?? null,
    }));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }
}
