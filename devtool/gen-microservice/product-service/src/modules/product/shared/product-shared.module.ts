import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Product } from 'src/data-access/boiler-plate';
import { ProductHelperService } from './shared/boiler-plate-helper.service';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [] }),
    MikroOrmModule.forFeature([Product]),
    // logic modules
  ],
  providers: [ProductHelperService],
  exports: [ProductHelperService],
})
export class ProductSharedModule {}
