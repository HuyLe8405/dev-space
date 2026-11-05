import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  UpdateProjectRequest,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';

export class UpdateProjectDto implements UpdateProjectRequest {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(50, { message: 'Project name must not exceed 50 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string | null;

  @IsOptional()
  @IsIn(WORKSPACE_ICONS, { message: 'Invalid project icon preset' })
  icon?: WorkspaceIcon;

  @IsOptional()
  @IsIn(WORKSPACE_COLORS, { message: 'Invalid project color preset' })
  color?: WorkspaceColor;
}

