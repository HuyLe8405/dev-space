/**
 * Area Management API Contracts & DTOs
 * Feature: 003-area-management
 */

import type { WorkspaceColor, WorkspaceIcon } from './workspace.contract';

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

/**
 * REST Endpoint Specification:
 * 
 * Base: /api/workspaces/:workspaceId/areas
 * 
 * POST   /api/workspaces/:workspaceId/areas
 *        -> 201 Created (CreateAreaRequest -> AreaDto)
 *        -> 400 Bad Request (Validation failure)
 *        -> 404 Not Found (Workspace not owned by user)
 *        -> 409 Conflict (Duplicate name in workspace)
 * 
 * GET    /api/workspaces/:workspaceId/areas
 *        -> 200 OK (-> AreaListResponse, ordered by order ASC)
 *        -> 404 Not Found (Workspace not owned by user)
 * 
 * GET    /api/workspaces/:workspaceId/areas/:areaId
 *        -> 200 OK (-> AreaDto)
 *        -> 404 Not Found (Workspace or Area not found / unauthorized)
 * 
 * PATCH  /api/workspaces/:workspaceId/areas/:areaId
 *        -> 200 OK (UpdateAreaRequest -> AreaDto)
 *        -> 400 Bad Request (Validation failure)
 *        -> 404 Not Found (Workspace or Area not found / unauthorized)
 *        -> 409 Conflict (Duplicate name in workspace)
 * 
 * DELETE /api/workspaces/:workspaceId/areas/:areaId
 *        -> 200 OK ({ success: true })
 *        -> 404 Not Found (Workspace or Area not found / unauthorized)
 * 
 * PUT    /api/workspaces/:workspaceId/areas/reorder
 *        -> 200 OK (ReorderAreasRequest -> AreaListResponse)
 *        -> 400 Bad Request (Missing/mismatched Area IDs)
 *        -> 404 Not Found (Workspace not owned by user)
 */

