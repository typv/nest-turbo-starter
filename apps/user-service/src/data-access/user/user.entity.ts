import { Gender, Role } from '@app/common';
import { BaseEntity } from '@app/core';
import { EntityRepositoryType, Hidden } from '@mikro-orm/core';
import { Entity, Filter, Property } from '@mikro-orm/decorators/legacy';
import { UserRepository } from './user.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'users', repository: () => UserRepository })
export class User extends BaseEntity<User> {
  [EntityRepositoryType]?: UserRepository;

  @Property({ type: 'string' })
  email: string;

  @Property({ type: 'string', nullable: true })
  firstName: string;

  @Property({ type: 'string', nullable: true })
  lastName: string;

  @Property({ type: 'string', nullable: true })
  fullName: string;

  @Property({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Property({ type: 'varchar', nullable: true })
  gender: Gender;

  @Property({ type: 'string', nullable: true })
  phoneNumber: string;

  @Property({ type: 'string', nullable: true })
  avatar: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean;

  @Property({ type: 'string', hidden: true })
  password: Hidden<string>;

  @Property({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Property({ type: 'string' })
  role: Role;

  @Property({ type: 'date', nullable: true })
  passwordChangedAt: Date;

  @Property({ type: 'string', nullable: true })
  googleId: string;

  @Property({ type: 'string', nullable: true })
  googleName: string;

  @Property({ type: 'string', nullable: true })
  googleAvatar: string;

  @Property({ type: 'boolean', fieldName: 'is_2fa_enabled', default: false })
  is2faEnabled: boolean;
}
