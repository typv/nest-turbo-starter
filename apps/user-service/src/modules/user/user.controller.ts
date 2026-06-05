import { User } from '@app/common';
import { UserRequestPayload } from '@app/common';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('/')
@ApiTags('User')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  getUserInfo(@User() userPayload: UserRequestPayload) {
    return this.userService.getUserInfo(userPayload);
  }
}
