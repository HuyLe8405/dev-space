'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type {
  WorkspaceDto,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceListResponse,
} from '@devspace/contracts';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth/hooks/use-auth';

const STORAGE_KEY = 'devspace:last_workspace_id';

interface WorkspaceContextValue {
  workspaces: WorkspaceDto[];
  activeWorkspace: WorkspaceDto | null;
  isLoading: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (dto: CreateWorkspaceRequest) => Promise<WorkspaceDto>;
  updateWorkspace: (
    id: string,
    dto: UpdateWorkspaceRequest,
  ) => Promise<WorkspaceDto>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspaceId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspaceIdState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<WorkspaceListResponse>('/workspaces');
      setWorkspaces(res.items);

      // Check for stored active workspace
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId && res.items.some((w) => w.id === storedId)) {
          setActiveWorkspaceIdState(storedId);
        } else if (res.items.length > 0) {
          setActiveWorkspaceIdState(res.items[0].id);
          localStorage.setItem(STORAGE_KEY, res.items[0].id);
        } else {
          setActiveWorkspaceIdState(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch workspaces';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchWorkspaces();
    }
  }, [authLoading, fetchWorkspaces]);

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const createWorkspace = useCallback(
    async (dto: CreateWorkspaceRequest): Promise<WorkspaceDto> => {
      setError(null);
      const newWs = await apiClient<WorkspaceDto>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      setWorkspaces((prev) => [newWs, ...prev]);
      setActiveWorkspaceId(newWs.id);
      return newWs;
    },
    [setActiveWorkspaceId],
  );

  const updateWorkspace = useCallback(
    async (
      id: string,
      dto: UpdateWorkspaceRequest,
    ): Promise<WorkspaceDto> => {
      setError(null);
      const updated = await apiClient<WorkspaceDto>(`/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? updated : w)),
      );
      return updated;
    },
    [],
  );

  const deleteWorkspace = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await apiClient<{ success: boolean }>(`/workspaces/${id}`, {
        method: 'DELETE',
      });

      setWorkspaces((prev) => {
        const remaining = prev.filter((w) => w.id !== id);
        if (activeWorkspaceId === id) {
          if (remaining.length > 0) {
            setActiveWorkspaceId(remaining[0].id);
          } else {
            setActiveWorkspaceId(null);
          }
        }
        return remaining;
      });
    },
    [activeWorkspaceId, setActiveWorkspaceId],
  );

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      isLoading: authLoading || isLoading,
      error,
      refreshWorkspaces: fetchWorkspaces,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      setActiveWorkspaceId,
    }),
    [
      workspaces,
      activeWorkspace,
      authLoading,
      isLoading,
      error,
      fetchWorkspaces,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      setActiveWorkspaceId,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
}

