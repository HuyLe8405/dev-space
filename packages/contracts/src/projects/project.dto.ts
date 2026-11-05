import {
  WorkspaceColor,
  WorkspaceIcon,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
} from '../workspaces/workspace.dto';

export const DEFAULT_PROJECT_ICON: WorkspaceIcon = 'Folder';
export const DEFAULT_PROJECT_COLOR: WorkspaceColor = 'cyan';

export interface ProjectDto {
  id: string;
  areaId: string;
  name: string;
  description: string | null;
  icon: WorkspaceIcon;
  color: WorkspaceColor;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface ProjectListResponse {
  items: ProjectDto[];
  total: number;
}

