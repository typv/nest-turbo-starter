import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/data-access/base.repository';
import { BoilerPlate } from './boiler-plate.entity';

@Injectable()
export class BoilerPlateRepository extends BaseRepository<BoilerPlate> {
  test() {
    console.log('test');
  }
}
