import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  CreateAreaRequest,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';

export class CreateAreaDto implements CreateAreaRequest {
  @IsString()
  @IsNotEmpty({ message: 'Area name is required' })
  @MinLength(1, { message: 'Area name is required' })
  @MaxLength(50, { message: 'Area name must not exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string;

  @IsOptional()
  @IsIn(WORKSPACE_ICONS, { message: 'Invalid area icon preset' })
  icon?: WorkspaceIcon;

  @IsOptional()
  @IsIn(WORKSPACE_COLORS, { message: 'Invalid area color preset' })
  color?: WorkspaceColor;
}

