import { PropertyDto } from '@app/common';
import { PickType } from '@nestjs/swagger';
import { AuthBaseDto } from './auth-base.dto';

export class ResetPasswordDto extends PickType(AuthBaseDto, [
  'email',
  'newPassword',
] as const) {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: '9b92c6b1-f124-40e9-abce-66e67854c5f5m',
  })
  token: string;
}
