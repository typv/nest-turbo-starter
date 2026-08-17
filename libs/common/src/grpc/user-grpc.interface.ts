import { Observable } from 'rxjs';
import { Gender, Role } from '../enums';

/**
 * Wire contract for `proto/user.proto`. Provider and consumers both import from
 * here, so a shape change fails compilation on every side.
 *
 * Dates cross the wire as ISO 8601 strings; proto3 has no date type.
 */

export interface GetUserRequest {
  id?: string;
  email?: string;
}

export interface GetUsersRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  role?: Role;
}

export interface UpdateUserRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  password?: string;
  passwordChangedAt?: string;
}

export interface DeleteUserRequest {
  id: string;
}

export interface FindUserByEmailRequest {
  email: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  role: Role;
  /** bcrypt hash — present because auth-service verifies credentials locally. */
  password?: string;
  passwordChangedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  is2faEnabled: boolean;
}

export interface GetUsersResponse {
  users: UserResponse[];
  total: number;
}

export interface DeleteUserResponse {
  success: boolean;
  id: string;
  message: string;
}

export interface UserGrpcService {
  getUser(request: GetUserRequest): Observable<UserResponse>;
  getUsers(request: GetUsersRequest): Observable<GetUsersResponse>;
  createUser(request: CreateUserRequest): Observable<UserResponse>;
  updateUser(request: UpdateUserRequest): Observable<UserResponse>;
  deleteUser(request: DeleteUserRequest): Observable<DeleteUserResponse>;
  findUserByEmail(request: FindUserByEmailRequest): Observable<UserResponse>;
}
