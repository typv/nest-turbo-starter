import { PaginationResponseDto, SwaggerApiDocument } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BulkDeleteProductBodyDto } from './dto/bulk-delete-product.dto';
import {
  ChangeProductStatusBodyDto,
  ChangeProductStatusResponseDto,
} from './dto/change-product-status.dto';
import { CreateProductBodyDto, CreateProductResponseDto } from './dto/create-product.dto';
import { GetProductDetailResponseDto } from './dto/get-product-details.dto';
import {
  GetProductListQueryDto,
  GetProductListResponseDto,
} from './dto/get-product-list.dto';
import {
  ReOrderProductBodyDto,
  ReOrderProductResponseDto,
} from './dto/re-order-product.dto';
import { UpdateProductBodyDto, UpdateProductResponseDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('product')
@ApiTags('Product')
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @SwaggerApiDocument({
    response: { type: CreateProductResponseDto },
    body: { type: CreateProductBodyDto, required: true },
    operation: {
      operationId: `createProduct`,
      summary: `Api createProduct`,
    },
  })
  async createProduct(
    @Body() body: CreateProductBodyDto,
  ): Promise<CreateProductResponseDto> {
    return this.productService.createProduct(body);
  }

  @Get()
  @SwaggerApiDocument({
    response: {
      type: GetProductListResponseDto,
      isPagination: true,
    },
    operation: {
      operationId: `getProductList`,
      summary: `Api getProductList`,
      description: `Retrieve a paginated list of products. Only get product attributes with type = SIZE`,
    },
  })
  async getProductList(
    @Query() query: GetProductListQueryDto,
  ): Promise<PaginationResponseDto<GetProductListResponseDto>> {
    return this.productService.getProductList(query);
  }

  @Get(':id')
  @SwaggerApiDocument({
    response: { type: GetProductDetailResponseDto },
    operation: {
      operationId: `getProductDetail`,
      summary: `Api getProductDetail`,
    },
  })
  async getProductDetail(@Param('id') id: string): Promise<GetProductDetailResponseDto> {
    return this.productService.getProductDetail(id);
  }

  @Put(':id')
  @SwaggerApiDocument({
    response: { type: UpdateProductResponseDto },
    body: { type: UpdateProductBodyDto, required: true },
    operation: {
      operationId: `updateProduct`,
      summary: `Api updateProduct`,
    },
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductBodyDto,
  ): Promise<UpdateProductResponseDto> {
    return this.productService.updateProduct(id, body);
  }

  @Delete(':id')
  @SwaggerApiDocument({
    response: { status: HttpStatus.NO_CONTENT },
    operation: {
      operationId: `deleteProduct`,
      summary: `Api deleteProduct`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param('id') id: string): Promise<void> {
    await this.productService.deleteProduct(id);
  }
}
