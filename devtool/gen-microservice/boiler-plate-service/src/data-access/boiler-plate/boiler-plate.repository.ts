import { BaseRepository } from '@app/core';
import { Injectable } from '@nestjs/common';
import { BoilerPlate } from './boiler-plate.entity';

@Injectable()
export class BoilerPlateRepository extends BaseRepository<BoilerPlate> {
  test() {
    console.log('test');
  }
}
