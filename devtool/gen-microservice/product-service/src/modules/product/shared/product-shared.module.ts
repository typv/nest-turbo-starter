import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Product } from 'src/data-access/product';
import { ProductHelperService } from './shared/product-helper.service';

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
