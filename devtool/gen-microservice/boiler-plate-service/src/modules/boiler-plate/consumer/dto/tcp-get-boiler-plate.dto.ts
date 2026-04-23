import { PropertyDto } from '@app/common';
import { BaseBoilerPlateResponseDto } from '../../dto/base.dto';

export class TcpGetBoilerPlatePayloadDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  boilerPlateId: string;
}

export class TcpGetBoilerPlateResponseDto extends BaseBoilerPlateResponseDto {}
