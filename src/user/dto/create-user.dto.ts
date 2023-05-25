import { UserRole } from '../entities/user.entity';
import {
  IsString,
  IsEmail,
  Matches,
  IsNotEmpty,
  IsStrongPassword,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'First name must be a string',
  })
  @IsNotEmpty()
  firstName: string;

  @IsString({
    message: 'Last name must be a string',
  })
  @IsNotEmpty()
  lastName: string;

  @Matches(/^(?:\+977)?98[0-9]{8}$/, {
    message: 'Phone number must be a valid Nepali phone number',
  })
  @IsString()
  phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({
    minLength: 5,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  @IsString()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
