import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@app/core';
import { User } from 'src/data-access/user/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<User> {}
