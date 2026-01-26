import { PickType } from '@nestjs/swagger';
import { AuthBaseDto } from './auth-base.dto';

export class ChangePasswordDto extends PickType(AuthBaseDto, [
  'password',
  'newPassword',
] as const) {}
