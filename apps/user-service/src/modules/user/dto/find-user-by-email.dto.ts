import { FindUserByEmailRequest } from '@app/common';
import { IsEmail } from 'class-validator';

export class FindUserByEmailDataDto implements FindUserByEmailRequest {
  @IsEmail()
  email: string;
}
