import {
  WorkspaceColor,
  WorkspaceIcon,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
} from '../workspaces/workspace.dto';

export const DEFAULT_AREA_ICON: WorkspaceIcon = 'Layers';
export const DEFAULT_AREA_COLOR: WorkspaceColor = 'indigo';

export interface AreaDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  icon: WorkspaceIcon;
  color: WorkspaceColor;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string | null;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface ReorderAreasRequest {
  areaIds: string[];
}

export interface AreaListResponse {
  items: AreaDto[];
  total: number;
}

