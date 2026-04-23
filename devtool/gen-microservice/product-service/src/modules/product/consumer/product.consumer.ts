import { AllExceptionFilter, MikroOrmMicroserviceInterceptor } from '@app/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Controller, Inject, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BoilerPlateRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';
import {
  TcpGetBoilerPlatePayloadDto,
  TcpGetBoilerPlateResponseDto,
} from './dto/tcp-get-boiler-plate.dto';
import { BoilerPlateService } from '../boiler-plate.service';
import { BoilerPlateHelperService } from '../shared/boiler-plate-helper.service';

@UseInterceptors(MikroOrmMicroserviceInterceptor)
@UseFilters(AllExceptionFilter)
@Controller()
export class BoilerPlateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    // repositories
    private readonly em: EntityManager,
    private readonly boilerPlateRepository: BoilerPlateRepository,
    // services
    private readonly boilerPlateHelperService: BoilerPlateHelperService,
    private readonly boilerPlateService: BoilerPlateService,
  ) {}

  // just a sample, todo: delete if not needed
  @MessagePattern('BoilerPlateMessagePattern.GetBoilerPlate') // must be enum
  async tcpGetBoilerPlate(
    @Payload() payload: TcpGetBoilerPlatePayloadDto,
  ): Promise<TcpGetBoilerPlateResponseDto> {
    // implement here
    return plainToInstance(TcpGetBoilerPlateResponseDto, {} as any, {
      excludeExtraneousValues: true,
    });
  }
}
