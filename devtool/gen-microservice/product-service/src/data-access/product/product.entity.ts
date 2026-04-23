import { Entity, EntityRepositoryType, Filter } from '@mikro-orm/core';
import { BaseEntity } from 'src/data-access/base.entity';
import { ProductRepository } from './boiler-plate.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'product', repository: () => ProductRepository })
export class Product extends BaseEntity<Product> {
  [EntityRepositoryType]?: ProductRepository;
}
