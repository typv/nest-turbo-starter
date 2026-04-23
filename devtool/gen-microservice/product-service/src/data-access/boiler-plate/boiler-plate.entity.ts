import { Entity, EntityRepositoryType, Filter } from '@mikro-orm/core';
import { BaseEntity } from 'src/data-access/base.entity';
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
