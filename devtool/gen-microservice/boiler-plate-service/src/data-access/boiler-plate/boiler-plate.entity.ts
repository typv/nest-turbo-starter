import { BaseEntity } from '@app/core';
import { EntityRepositoryType, Hidden } from '@mikro-orm/core';
import { Entity, Filter, Property } from '@mikro-orm/decorators/legacy';
import { BoilerPlateRepository } from './boiler-plate.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'boiler_plate', repository: () => BoilerPlateRepository })
export class BoilerPlate extends BaseEntity<BoilerPlate> {
  [EntityRepositoryType]?: BoilerPlateRepository;
}
