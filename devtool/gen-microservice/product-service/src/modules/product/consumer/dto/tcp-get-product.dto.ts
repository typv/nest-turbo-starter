import { PropertyDto } from '@app/common';
import { BaseProductResponseDto } from '../../dto/base.dto';

export class TcpGetProductPayloadDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  productId: string;
}

export class TcpGetProductResponseDto extends BaseProductResponseDto {}
