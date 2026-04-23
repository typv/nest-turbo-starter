import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Product } from 'src/data-access/product';
import { ProductConsumer } from './consumer/product.consumer';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductSharedModule } from './shared/product-shared.module';

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
