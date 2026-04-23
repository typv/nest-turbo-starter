import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Product } from 'src/data-access/boiler-plate';
import { ProductConsumer } from './consumer/boiler-plate.consumer';
import { ProductController } from './boiler-plate.controller';
import { ProductService } from './boiler-plate.service';
import { ProductSharedModule } from './shared/boiler-plate-shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [] }),
    MikroOrmModule.forFeature([Product]),
    ProductSharedModule,
    // logical modules
  ],
  controllers: [ProductController, ProductConsumer],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
