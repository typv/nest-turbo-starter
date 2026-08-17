import {
  AllExceptionFilter,
  CreateUserRequest,
  DeleteUserResponse,
  GetUserRequest,
  GetUsersResponse,
  MikroOrmMicroserviceInterceptor,
  PayloadValidationPipe,
  USER_GRPC_SERVICE,
  UserResponse,
} from '@app/common';
import { Controller, UseFilters, UseInterceptors, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  DeleteUserDataDto,
  FindUserByEmailDataDto,
  GetUsersDataDto,
  UpdateUserDataDto,
} from './dto';
import { UserService } from './user.service';

/**
 * gRPC surface of user-service.
 *
 * The pipe is declared here because `app.useGlobalPipes()` only covers the HTTP
 * server of a hybrid app. Handlers needing validation also take a class DTO:
 * interfaces are erased at runtime, leaving the pipe no metatype to work with.
 */
@UsePipes(new PayloadValidationPipe())
@UseInterceptors(MikroOrmMicroserviceInterceptor)
@UseFilters(AllExceptionFilter)
@Controller()
export class UserConsumer {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod(USER_GRPC_SERVICE, 'CreateUser')
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.userService.createUser(data);
  }

  @GrpcMethod(USER_GRPC_SERVICE, 'GetUser')
  async getUser(data: GetUserRequest): Promise<UserResponse> {
    return this.userService.getUser(data);
  }

  @GrpcMethod(USER_GRPC_SERVICE, 'GetUsers')
  async getUsers(data: GetUsersDataDto): Promise<GetUsersResponse> {
    return this.userService.getUsers(data);
  }

  @GrpcMethod(USER_GRPC_SERVICE, 'UpdateUser')
  async updateUser(data: UpdateUserDataDto): Promise<UserResponse> {
    return this.userService.updateUser(data);
  }

  @GrpcMethod(USER_GRPC_SERVICE, 'DeleteUser')
  async deleteUser(data: DeleteUserDataDto): Promise<DeleteUserResponse> {
    return this.userService.deleteUser(data);
  }

  @GrpcMethod(USER_GRPC_SERVICE, 'FindUserByEmail')
  async findUserByEmail(data: FindUserByEmailDataDto): Promise<UserResponse> {
    return this.userService.findUserByEmail(data);
  }
}
