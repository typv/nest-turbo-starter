import { PropertyDto } from '@app/common';
import { IsEmail, IsStrongPassword, Matches, MaxLength } from 'class-validator';

export class AuthBaseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'example@email.com',
  })
  @IsEmail()
  @MaxLength(50)
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Sota@001',
  })
  @MaxLength(50)
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Matches(/^\S+$/, {
    message: 'Whitespace not allowed',
  })
  password: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Sota@123',
  })
  @MaxLength(50)
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Matches(/^\S+$/, {
    message: 'Whitespace not allowed',
  })
  newPassword: string;
}
