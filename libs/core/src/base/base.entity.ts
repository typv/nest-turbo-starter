import { PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Exclude } from 'class-transformer';
import { v7 } from 'uuid';

export abstract class BaseEntity<T = any> {
  constructor(partial?: Partial<T>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Exclude()
  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;
}
