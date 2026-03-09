import { Gender, Role } from '@app/common';

export class GetUserDataDto {
  id?: string;
  email?: string;
}

export class GetUserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
