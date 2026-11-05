import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  CreateWorkspaceRequest,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';

export class CreateWorkspaceDto implements CreateWorkspaceRequest {
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(1, { message: 'Workspace name is required' })
  @MaxLength(50, { message: 'Workspace name must not exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string;

  @IsOptional()
  @IsIn(WORKSPACE_ICONS, { message: 'Invalid workspace icon preset' })
  icon?: WorkspaceIcon;

  @IsOptional()
  @IsIn(WORKSPACE_COLORS, { message: 'Invalid workspace color preset' })
  color?: WorkspaceColor;
}
