import { EntityManager, wrap } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BoilerPlateRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';

@Injectable()
export class BoilerPlateHelperService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly boilerPlateRepository: BoilerPlateRepository,
  ) {
    this.logger = this.logger.child({ context: BoilerPlateHelperService.name });
  }
}
