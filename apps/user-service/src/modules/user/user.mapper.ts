import { UserResponse } from '@app/common';
import { User } from 'src/data-access/user';

/** Serialise a Date column to the ISO string the proto contract declares. */
const toIso = (value?: Date | null): string | undefined => value?.toISOString();

/**
 * Map a User entity onto the wire contract. Written out field by field so no
 * column reaches a caller unless it is listed here.
 *
 * @param includePassword auth-service verifies credentials locally, so GetUser
 *   and FindUserByEmail return the hash. No other caller does.
 *   See docs/service-communication.md.
 */
export function toUserResponse(user: User, includePassword = false): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    fullName: user.fullName ?? undefined,
    dateOfBirth: toIso(user.dateOfBirth),
    gender: user.gender ?? undefined,
    phoneNumber: user.phoneNumber ?? undefined,
    avatar: user.avatar ?? undefined,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    role: user.role,
    ...(includePassword && { password: user.password as unknown as string }),
    passwordChangedAt: toIso(user.passwordChangedAt),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
    is2faEnabled: user.is2faEnabled,
  };
}
