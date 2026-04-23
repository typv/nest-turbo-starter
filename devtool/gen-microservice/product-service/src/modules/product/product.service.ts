import { PaginationResponseDto } from '@app/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ProductRepository } from 'src/data-access/boiler-plate';
import { Logger } from 'winston';
import { CreateProductBodyDto, CreateProductResponseDto } from './dto/create-boiler-plate.dto';
import { GetProductDetailResponseDto } from './dto/get-boiler-plate-details.dto';
import {
  GetProductListQueryDto,
  GetProductListResponseDto,
} from './dto/get-boiler-plate-list.dto';
import { UpdateProductBodyDto, UpdateProductResponseDto } from './dto/update-boiler-plate.dto';
import { ProductHelperService } from './shared/boiler-plate-helper.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly productRepository: ProductRepository,
    private readonly productHelperService: ProductHelperService,
  ) {
    this.logger = this.logger.child({ context: ProductService.name });
  }

  async createProduct(body: CreateProductBodyDto): Promise<CreateProductResponseDto> {
    return; // todo: implement here
  }

  async getProductList(
    query: GetProductListQueryDto,
  ): Promise<PaginationResponseDto<GetProductListResponseDto>> {
    return; // todo: implement here
  }

  async getProductDetail(id: string): Promise<GetProductDetailResponseDto> {
    return; // todo: implement here
  }

  async updateProduct(
    productId: string,
    body: UpdateProductBodyDto,
  ): Promise<UpdateProductResponseDto> {
    return; // todo: implement here
  }

  async deleteProduct(id: string): Promise<any> {
    return; // todo: implement here
  }
}
