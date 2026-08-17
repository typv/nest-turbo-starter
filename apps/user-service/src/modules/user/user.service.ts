import {
  CreateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  ERROR_RESPONSE,
  FindUserByEmailRequest,
  GetUserRequest,
  GetUsersRequest,
  GetUsersResponse,
  hashData,
  ServerException,
  UserRequestPayload,
  UserResponse,
} from '@app/common';
import { RedisService } from '@app/core';
import { EntityManager, wrap } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { getAppConfig } from 'src/config';
import { UserRepository } from 'src/data-access/user';
import { Logger } from 'winston';
import { UpdateUserDataDto } from './dto';
import { toUserResponse } from './user.mapper';

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

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const existingUser = await this.userRepo.findOne({ email: data.email });
    if (existingUser) {
      throw new ServerException(ERROR_RESPONSE.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await hashData(data.password);

    const user = this.userRepo.create({
      ...data,
      // dateOfBirth is an ISO string on the wire; MikroORM needs a Date.
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      password: hashedPassword,
    });

    await this.em.persist(user).flush();

    return toUserResponse(user);
  }

  async getUser(data: GetUserRequest): Promise<UserResponse> {
    const user = await this.userRepo.findOne(data);
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    // auth-service verifies the hash locally, so GetUser must return it.
    return toUserResponse(user, true);
  }

  async getUsers(data: GetUsersRequest): Promise<GetUsersResponse> {
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
      users: users.map((user) => toUserResponse(user)),
      total,
    };
  }

  async updateUser(data: UpdateUserDataDto): Promise<UserResponse> {
    const user = await this.userRepo.findOne({ id: data.id });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    // Remove id from data since we don't want to update it
    const { ...updateData } = data;

    // Date columns arrive as ISO strings; MikroORM needs real Dates.
    const assignable = {
      ...updateData,
      ...(updateData.dateOfBirth && { dateOfBirth: new Date(updateData.dateOfBirth) }),
      ...(updateData.passwordChangedAt && {
        passwordChangedAt: new Date(updateData.passwordChangedAt),
      }),
    };

    wrap(user).assign(assignable);
    await this.em.flush();

    // Deactivation must take effect now, not when the JWT expires.
    await this.evictUserCache(user.id, updateData.isActive === false);

    return toUserResponse(user);
  }

  async deleteUser(data: DeleteUserRequest): Promise<DeleteUserResponse> {
    const user = await this.userRepo.findOne({ id: data.id });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    user.deletedAt = new Date();
    await this.em.flush();

    await this.evictUserCache(user.id, true);

    return {
      success: true,
      id: user.id,
      message: 'User deleted successfully',
    };
  }

  async findUserByEmail(data: FindUserByEmailRequest): Promise<UserResponse> {
    const user = await this.userRepo.findOne({ email: data.email });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    return toUserResponse(user, true);
  }

  /**
   * Best-effort cache eviction. Runs after the write has committed, so a Redis
   * outage must not turn a successful write into a failed response; the TTL
   * bounds the staleness instead.
   */
  private async evictUserCache(id: string, revokeSessions = false): Promise<void> {
    try {
      await this.redisService.deleteKey(this.redisService.getUserInfoKey(id));

      if (revokeSessions) {
        await this.redisService.deleteByPattern(
          this.redisService.getUserTokenPattern(id),
        );
      }
    } catch (error) {
      this.logger.error({
        context: `${UserService.name}.evictUserCache`,
        message: `Failed to evict cache for user ${id}`,
        error,
      });
    }
  }

  async getUserInfo({ id }: UserRequestPayload): Promise<UserResponse> {
    const userInfoKey = this.redisService.getUserInfoKey(id);

    let userInfo = await this.redisService.getValue<UserResponse>(userInfoKey);
    if (userInfo) return userInfo;

    const user = await this.userRepo.findOne({ id });
    if (!user) throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);

    userInfo = toUserResponse(user);
    await this.redisService.setValue(
      userInfoKey,
      userInfo,
      getAppConfig().cacheTtlInSeconds,
    );

    return userInfo;
  }
}
