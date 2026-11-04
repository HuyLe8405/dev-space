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
