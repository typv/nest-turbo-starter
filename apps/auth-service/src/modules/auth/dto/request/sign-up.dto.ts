import { PickType } from '@nestjs/swagger';
import { AuthBaseDto } from './auth-base.dto';

export class SignUpDto extends PickType(AuthBaseDto, ['email', 'password'] as const) {}
