import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  UpdateWorkspaceRequest,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';

export class UpdateWorkspaceDto implements UpdateWorkspaceRequest {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Workspace name cannot be empty' })
  @MaxLength(50, { message: 'Workspace name must not exceed 50 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string | null;

  @IsOptional()
  @IsIn(WORKSPACE_ICONS, { message: 'Invalid workspace icon preset' })
  icon?: WorkspaceIcon;

  @IsOptional()
  @IsIn(WORKSPACE_COLORS, { message: 'Invalid workspace color preset' })
  color?: WorkspaceColor;
}

