import { PropertyDto } from '@app/common';
import { PickType } from '@nestjs/swagger';
import { AuthBaseDto } from './auth-base.dto';

export class LoginDto extends PickType(AuthBaseDto, ['email'] as const) {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: '12345678Aa@',
  })
  password: string;
}
