import { FindManyOptions } from 'typeorm';
import { BaseQueryDto } from './base-query.dto';

/**
 * Maps BaseQueryDto into TypeORM FindManyOptions for paginated queries.
 */
export function paginateQuery<T>(query: BaseQueryDto): FindManyOptions<T> {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    order: {
      [query.sortBy]: query.order,
    } as FindManyOptions<T>['order'],
  };
}
