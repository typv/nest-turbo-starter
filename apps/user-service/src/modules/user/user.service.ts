import { ERROR_RESPONSE, hashData, ServerException } from '@app/common';
import { UserRequestPayload } from '@app/common';
import { RedisService } from '@app/core';
import { EntityManager, wrap } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { getAppConfig } from 'src/config';
import { UserRepository } from 'src/data-access/user';
import { Logger } from 'winston';
import {
  CreateUserDataDto,
  CreateUserResponseDto,
  DeleteUserDataDto,
  DeleteUserResponseDto,
  FindUserByEmailDataDto,
  FindUserByEmailResponseDto,
  GetUserDataDto,
  GetUserResponseDto,
  GetUsersDataDto,
  GetUsersResponseDto,
  UpdateUserDataDto,
  UpdateUserResponseDto,
} from './dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly userRepo: UserRepository,
    private readonly redisService: RedisService,
  ) {
    this.logger = this.logger.child({ context: UserService.name });
  }

  async createUser(data: CreateUserDataDto): Promise<CreateUserResponseDto> {
    const existingUser = await this.userRepo.findOne({ email: data.email });
    if (existingUser) {
      throw new ServerException(ERROR_RESPONSE.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await hashData(data.password);

    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
    });

    await this.em.persist(user).flush();

    return plainToInstance(CreateUserResponseDto, user);
  }

  async getUser(data: GetUserDataDto): Promise<GetUserResponseDto> {
    const user = await this.userRepo.findOne(data);
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    return plainToInstance(GetUserResponseDto, user, { enableImplicitConversion: true });
  }

  async getUsers(data: GetUsersDataDto): Promise<GetUsersResponseDto> {
    const { limit = 10, offset = 0, search } = data;

    const queryOptions: any = {};

    if (search) {
      queryOptions.$or = [
        { email: { $ilike: `%${search}%` } },
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } },
        { fullName: { $ilike: `%${search}%` } },
      ];
    }

    const [users, total] = await this.userRepo.findAndCount(queryOptions, {
      limit,
      offset,
      orderBy: { createdAt: 'DESC' },
    });

    return {
      users: plainToInstance(GetUserResponseDto, users),
      total,
    };
  }

  async updateUser(data: UpdateUserDataDto): Promise<UpdateUserResponseDto> {
    const user = await this.userRepo.findOne({ id: data.id });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    // Remove id from data since we don't want to update it
    const { ...updateData } = data;

    wrap(user).assign(updateData);
    await this.em.flush();

    return plainToInstance(UpdateUserResponseDto, user);
  }

  async deleteUser(data: DeleteUserDataDto): Promise<DeleteUserResponseDto> {
    const user = await this.userRepo.findOne({ id: data.id });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    user.deletedAt = new Date();
    await this.em.flush();

    return {
      success: true,
      id: user.id,
      message: 'User deleted successfully',
    };
  }

  async findUserByEmail(
    data: FindUserByEmailDataDto,
  ): Promise<FindUserByEmailResponseDto> {
    const user = await this.userRepo.findOne({ email: data.email });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    return plainToInstance(FindUserByEmailResponseDto, user);
  }

  async getUserInfo({ id }: UserRequestPayload): Promise<GetUserResponseDto> {
    const userInfoKey = this.redisService.getUserInfoKey(id);

    let userInfo = await this.redisService.getValue<GetUserResponseDto>(userInfoKey);
    if (userInfo) return userInfo;

    const user = await this.userRepo.findOne({ id });
    if (!user) throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);

    userInfo = plainToInstance(GetUserResponseDto, wrap(user).toJSON());
    await this.redisService.setValue(
      userInfoKey,
      userInfo,
      getAppConfig().cacheTtlInMinutes,
    );

    return userInfo;
  }
}
