import { DeleteUserRequest } from '@app/common';
import { IsUUID } from 'class-validator';

export class DeleteUserDataDto implements DeleteUserRequest {
  @IsUUID()
  id: string;
}
