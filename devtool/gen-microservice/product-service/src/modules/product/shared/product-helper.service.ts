import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ProductRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';

@Injectable()
export class ProductHelperService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly productRepository: ProductRepository,
  ) {
    this.logger = this.logger.child({ context: ProductHelperService.name });
  }
}
