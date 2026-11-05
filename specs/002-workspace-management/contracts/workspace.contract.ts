/**
 * Workspace Management API Contracts & DTOs
 * Feature: 002-workspace-management
 */

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

/**
 * REST Endpoint Specification:
 * 
 * POST   /api/workspaces          -> 201 Created (CreateWorkspaceRequest -> WorkspaceDto)
 * GET    /api/workspaces          -> 200 OK (-> WorkspaceListResponse)
 * GET    /api/workspaces/:id      -> 200 OK (-> WorkspaceDto) | 404 Not Found
 * PATCH  /api/workspaces/:id      -> 200 OK (UpdateWorkspaceRequest -> WorkspaceDto) | 404 Not Found
 * DELETE /api/workspaces/:id      -> 200 OK ({ success: true }) | 404 Not Found
 */

