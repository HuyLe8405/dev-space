import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { RegisterRequest } from '@devspace/contracts';

export class RegisterDto implements RegisterRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'Display name cannot exceed 60 characters' })
  displayName?: string;
}
