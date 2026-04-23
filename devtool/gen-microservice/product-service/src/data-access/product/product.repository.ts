import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/data-access/base.repository';
import { Product } from './boiler-plate.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  test() {
    console.log('test');
  }
}
