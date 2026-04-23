import { PaginationQueryDto } from '@app/common';
import { BaseProductResponseDto } from './base.dto';

export class GetProductListResponseDto extends BaseProductResponseDto {}

export class GetProductListQueryDto extends PaginationQueryDto {}
