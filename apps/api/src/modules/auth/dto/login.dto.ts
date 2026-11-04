import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { LoginRequest } from '@devspace/contracts';

export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
