import { PaginationResponseDto } from '@app/common';
import { EntityManager, wrap } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BoilerPlateRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';
import { CreateBoilerPlateBodyDto, CreateBoilerPlateResponseDto } from './dto/create-boiler-plate.dto';
import { GetBoilerPlateDetailResponseDto } from './dto/get-boiler-plate-details.dto';
import {
  GetBoilerPlateListQueryDto,
  GetBoilerPlateListResponseDto,
} from './dto/get-boiler-plate-list.dto';
import { UpdateBoilerPlateBodyDto, UpdateBoilerPlateResponseDto } from './dto/update-boiler-plate.dto';
import { BoilerPlateHelperService } from './shared/boiler-plate-helper.service';

@Injectable()
export class BoilerPlateService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly boilerPlateRepository: BoilerPlateRepository,
    private readonly boilerPlateHelperService: BoilerPlateHelperService,
  ) {
    this.logger = this.logger.child({ context: BoilerPlateService.name });
  }

  async createBoilerPlate(body: CreateBoilerPlateBodyDto): Promise<CreateBoilerPlateResponseDto> {
    return; // todo: implement here
  }

  async getBoilerPlateList(
    query: GetBoilerPlateListQueryDto,
  ): Promise<PaginationResponseDto<GetBoilerPlateListResponseDto>> {
    return; // todo: implement here
  }

  async getBoilerPlateDetail(id: string): Promise<GetBoilerPlateDetailResponseDto> {
    return; // todo: implement here
  }

  async updateBoilerPlate(
    boilerPlateId: string,
    body: UpdateBoilerPlateBodyDto,
  ): Promise<UpdateBoilerPlateResponseDto> {
    return; // todo: implement here
  }

  async deleteBoilerPlate(id: string): Promise<any> {
    return; // todo: implement here
  }
}
