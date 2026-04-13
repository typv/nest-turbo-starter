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

  @Property()
  email: string;

  @Property({ nullable: true })
  firstName: string;

  @Property({ nullable: true })
  lastName: string;

  @Property({ nullable: true })
  fullName: string;

  @Property({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Property({ type: 'varchar', nullable: true })
  gender: Gender;

  @Property({ nullable: true })
  phoneNumber: string;

  @Property({ nullable: true })
  avatar: string;

  @Property({ default: true })
  isActive: boolean;

  @Property({ hidden: true })
  password: Hidden<string>;

  @Property({ default: false })
  emailVerified: boolean;

  @Property({ type: 'varchar' })
  role: Role;

  @Property({ type: 'date', nullable: true })
  passwordChangedAt: Date;

  @Property({ nullable: true })
  googleId: string;

  @Property({ nullable: true })
  googleName: string;

  @Property({ nullable: true })
  googleAvatar: string;

  @Property({ fieldName: 'is_2fa_enabled', default: false })
  is2faEnabled: boolean;
}
