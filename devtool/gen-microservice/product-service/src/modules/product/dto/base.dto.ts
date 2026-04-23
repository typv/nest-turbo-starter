import { PropertyDto } from '@app/common';

export class BaseProductResponseDto {
  @PropertyDto()
  id: string;

  @PropertyDto()
  createdAt: string;

  @PropertyDto()
  updatedAt: string;
}
