import { PropertyDto } from '@app/common';

export class BaseBoilerPlateResponseDto {
  @PropertyDto()
  id: string;

  @PropertyDto()
  createdAt: string;

  @PropertyDto()
  updatedAt: string;
}
