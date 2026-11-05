export const WORKSPACE_ICONS = [
  'Briefcase',
  'Code',
  'BookOpen',
  'Terminal',
  'Compass',
  'Cpu',
  'Layers',
  'Boxes',
  'Flame',
  'Folder',
  'Sparkles',
  'User',
] as const;

export type WorkspaceIcon = (typeof WORKSPACE_ICONS)[number];

export const WORKSPACE_COLORS = [
  'slate',
  'blue',
  'indigo',
  'purple',
  'emerald',
  'amber',
  'rose',
  'cyan',
] as const;

export type WorkspaceColor = (typeof WORKSPACE_COLORS)[number];

export const DEFAULT_WORKSPACE_ICON: WorkspaceIcon = 'Briefcase';
export const DEFAULT_WORKSPACE_COLOR: WorkspaceColor = 'blue';

export interface WorkspaceDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: WorkspaceIcon;
  color: WorkspaceColor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string | null;
  icon?: WorkspaceIcon;
  color?: WorkspaceColor;
}

export interface WorkspaceListResponse {
  items: WorkspaceDto[];
  total: number;
}

