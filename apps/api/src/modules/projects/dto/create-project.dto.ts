import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  CreateProjectRequest,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';

export class CreateProjectDto implements CreateProjectRequest {
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(1, { message: 'Project name is required' })
  @MaxLength(50, { message: 'Project name must not exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string;

  @IsOptional()
  @IsIn(WORKSPACE_ICONS, { message: 'Invalid project icon preset' })
  icon?: WorkspaceIcon;

  @IsOptional()
  @IsIn(WORKSPACE_COLORS, { message: 'Invalid project color preset' })
  color?: WorkspaceColor;
}

