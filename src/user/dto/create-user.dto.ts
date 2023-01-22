import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  age: number;
  role?: UserRole;
}
