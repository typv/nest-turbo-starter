import { PaginationQueryDto } from '@app/common';
import { BaseBoilerPlateResponseDto } from './base.dto';

export class GetBoilerPlateListResponseDto extends BaseBoilerPlateResponseDto {}

export class GetBoilerPlateListQueryDto extends PaginationQueryDto {}
