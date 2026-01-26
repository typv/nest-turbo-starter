import { PickType } from '@nestjs/swagger';
import { AuthBaseDto } from './auth-base.dto';

export class ForgotPasswordDto extends PickType(AuthBaseDto, ['email'] as const) {}
