import { PaginationResponseDto, SwaggerApiDocument } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BoilerPlateService } from './boiler-plate.service';
import {
  CreateBoilerPlateBodyDto,
  CreateBoilerPlateResponseDto,
} from './dto/create-boiler-plate.dto';
import { GetBoilerPlateDetailResponseDto } from './dto/get-boiler-plate-details.dto';
import {
  GetBoilerPlateListQueryDto,
  GetBoilerPlateListResponseDto,
} from './dto/get-boiler-plate-list.dto';
import {
  UpdateBoilerPlateBodyDto,
  UpdateBoilerPlateResponseDto,
} from './dto/update-boiler-plate.dto';

@Controller('boiler-plate')
@ApiTags('Boiler Plate')
@ApiBearerAuth()
export class BoilerPlateController {
  constructor(private readonly boilerPlateService: BoilerPlateService) {}

  @Post()
  @SwaggerApiDocument({
    response: { type: CreateBoilerPlateResponseDto },
    body: { type: CreateBoilerPlateBodyDto, required: true },
    operation: {
      operationId: `createBoilerPlate`,
      summary: `Api createBoilerPlate`,
    },
  })
  async createBoilerPlate(
    @Body() body: CreateBoilerPlateBodyDto,
  ): Promise<CreateBoilerPlateResponseDto> {
    return this.boilerPlateService.createBoilerPlate(body);
  }

  @Get()
  @SwaggerApiDocument({
    response: {
      type: GetBoilerPlateListResponseDto,
      isPagination: true,
    },
    operation: {
      operationId: `getBoilerPlateList`,
      summary: `Api getBoilerPlateList`,
    },
  })
  async getBoilerPlateList(
    @Query() query: GetBoilerPlateListQueryDto,
  ): Promise<PaginationResponseDto<GetBoilerPlateListResponseDto>> {
    return this.boilerPlateService.getBoilerPlateList(query);
  }

  @Get(':id')
  @SwaggerApiDocument({
    response: { type: GetBoilerPlateDetailResponseDto },
    operation: {
      operationId: `getBoilerPlateDetail`,
      summary: `Api getBoilerPlateDetail`,
    },
  })
  async getBoilerPlateDetail(
    @Param('id') id: string,
  ): Promise<GetBoilerPlateDetailResponseDto> {
    return this.boilerPlateService.getBoilerPlateDetail(id);
  }

  @Put(':id')
  @SwaggerApiDocument({
    response: { type: UpdateBoilerPlateResponseDto },
    body: { type: UpdateBoilerPlateBodyDto, required: true },
    operation: {
      operationId: `updateBoilerPlate`,
      summary: `Api updateBoilerPlate`,
    },
  })
  async updateBoilerPlate(
    @Param('id') id: string,
    @Body() body: UpdateBoilerPlateBodyDto,
  ): Promise<UpdateBoilerPlateResponseDto> {
    return this.boilerPlateService.updateBoilerPlate(id, body);
  }

  @Delete(':id')
  @SwaggerApiDocument({
    response: { status: HttpStatus.NO_CONTENT },
    operation: {
      operationId: `deleteBoilerPlate`,
      summary: `Api deleteBoilerPlate`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoilerPlate(@Param('id') id: string): Promise<void> {
    await this.boilerPlateService.deleteBoilerPlate(id);
  }
}
