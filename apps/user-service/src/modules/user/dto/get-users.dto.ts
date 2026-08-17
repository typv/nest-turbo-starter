import { GetUsersRequest } from '@app/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetUsersDataDto implements GetUsersRequest {
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
