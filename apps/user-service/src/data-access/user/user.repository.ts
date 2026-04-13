import { BaseRepository } from '@app/core';
import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserRepository extends BaseRepository<User> {}
