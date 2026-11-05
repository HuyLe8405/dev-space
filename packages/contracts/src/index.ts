/**
 * DevSpace Shared Contracts
 * Framework-agnostic interfaces and types shared across apps.
 */

export interface HealthStatus {
  status: 'ok';
  service: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export * from './auth/auth.dto';
export * from './auth/user.dto';
export * from './workspaces/workspace.dto';
