import { APP_DEFAULTS } from '@app/common';
import { EntityRepository } from '@mikro-orm/core';
import { SelectQueryBuilder } from '@mikro-orm/postgresql';
import { BaseEntity } from 'src/data-access/base.entity';

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    pageSize: number;
    totalPages: number;
    page: number;
  };
}

export abstract class BaseRepository<T extends BaseEntity> extends EntityRepository<T> {
  async paginate(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = APP_DEFAULTS.PAGINATION.PAGE_DEFAULT,
    pageSize: number = APP_DEFAULTS.PAGINATION.LIMIT_DEFAULT,
  ): Promise<PaginationResult<T>> {
    page = +page;
    pageSize = +pageSize;
    const offset = (page - 1) * pageSize;

    if (offset > 0) queryBuilder.offset(offset);
    if (pageSize > 0) queryBuilder.limit(pageSize);

    let items: any[];
    let totalItems: number;
    const [results, count] = await queryBuilder.getResultAndCount();

    items = results;
    totalItems = count;
    const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

    return {
      data: items,
      pagination: {
        total: totalItems,
        pageSize,
        totalPages,
        page,
      },
    };
  }
}
