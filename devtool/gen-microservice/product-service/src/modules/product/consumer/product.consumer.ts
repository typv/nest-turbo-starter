import { AllExceptionFilter, MikroOrmMicroserviceInterceptor } from '@app/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Controller, Inject, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ProductRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';
import {
  TcpGetProductPayloadDto,
  TcpGetProductResponseDto,
} from './dto/tcp-get-boiler-plate.dto';
import { ProductService } from '../boiler-plate.service';
import { ProductHelperService } from '../shared/boiler-plate-helper.service';

@UseInterceptors(MikroOrmMicroserviceInterceptor)
@UseFilters(AllExceptionFilter)
@Controller()
export class ProductConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    // repositories
    private readonly em: EntityManager,
    private readonly productRepository: ProductRepository,
    // services
    private readonly productHelperService: ProductHelperService,
    private readonly productService: ProductService,
  ) {}

  // just a sample, todo: delete if not needed
  @MessagePattern('ProductMessagePattern.GetProduct') // must be enum
  async tcpGetProduct(
    @Payload() payload: TcpGetProductPayloadDto,
  ): Promise<TcpGetProductResponseDto> {
    // implement here
    return plainToInstance(TcpGetProductResponseDto, {} as any, {
      excludeExtraneousValues: true,
    });
  }
}
