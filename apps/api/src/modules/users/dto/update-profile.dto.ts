import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { UpdateProfileRequest } from '@devspace/contracts';

export class UpdateProfileDto implements UpdateProfileRequest {
  @IsString()
  @IsNotEmpty({ message: 'Display name cannot be empty' })
  @MinLength(1, { message: 'Display name must be at least 1 character long' })
  @MaxLength(60, { message: 'Display name cannot exceed 60 characters' })
  displayName!: string;
}
