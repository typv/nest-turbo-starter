import { Public, SwaggerApiDocument } from '@app/common';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/')
  getHello(): string {
    console.log('Health check endpoint called');
    return this.appService.getHello();
  }
}
