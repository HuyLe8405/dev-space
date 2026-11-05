'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type {
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
} from '@devspace/contracts';
import { apiClient } from '@/lib/api-client';
import { AreaToast, type ToastMessage } from '@/features/areas/components/area-toast';

export interface ProjectContextValue {
  projects: ProjectDto[];
  activeProject: ProjectDto | null;
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  setActiveProjectId: (id: string | null) => void;
  createProject: (dto: CreateProjectRequest) => Promise<ProjectDto>;
  updateProject: (id: string, dto: UpdateProjectRequest) => Promise<ProjectDto>;
  deleteProject: (id: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({
  workspaceId,
  areaId,
  children,
}: {
  workspaceId: string;
  areaId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ id: Date.now().toString(), message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!workspaceId || !areaId) {
      setProjects([]);
      setActiveProjectIdState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<ProjectListResponse>(
        `/workspaces/${workspaceId}/areas/${areaId}/projects`,
      );
      setProjects(res.items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, areaId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // URL query parameter synchronization (?project=:projectId)
  useEffect(() => {
    if (isLoading) return;

    const queryProjectId = searchParams.get('project');

    if (!queryProjectId) {
      setActiveProjectIdState(null);
      return;
    }

    const matched = projects.find((p) => p.id === queryProjectId);
    if (matched) {
      setActiveProjectIdState(queryProjectId);
    } else if (projects.length > 0) {
      // Query param is present but invalid/not found
      setActiveProjectIdState(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('project');
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      showToast('Requested project was not found.', 'info');
    }
  }, [projects, isLoading, searchParams, pathname, router, showToast]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const setActiveProjectId = useCallback(
    (id: string | null) => {
      setActiveProjectIdState(id);
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set('project', id);
      } else {
        params.delete('project');
      }
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const createProject = useCallback(
    async (dto: CreateProjectRequest): Promise<ProjectDto> => {
      setError(null);
      const newProject = await apiClient<ProjectDto>(
        `/workspaces/${workspaceId}/areas/${areaId}/projects`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      setProjects((prev) => [newProject, ...prev]);
      showToast(`Project "${newProject.name}" created`, 'success');
      return newProject;
    },
    [workspaceId, areaId, showToast],
  );

  const updateProject = useCallback(
    async (id: string, dto: UpdateProjectRequest): Promise<ProjectDto> => {
      setError(null);
      const updated = await apiClient<ProjectDto>(
        `/workspaces/${workspaceId}/areas/${areaId}/projects/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Project "${updated.name}" updated`, 'success');
      return updated;
    },
    [workspaceId, areaId, showToast],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await apiClient<void>(
        `/workspaces/${workspaceId}/areas/${areaId}/projects/${id}`,
        {
          method: 'DELETE',
        },
      );
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
      showToast('Project deleted', 'info');
    },
    [workspaceId, areaId, activeProjectId, setActiveProjectId, showToast],
  );

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      activeProjectId,
      isLoading,
      error,
      refreshProjects: fetchProjects,
      setActiveProjectId,
      createProject,
      updateProject,
      deleteProject,
      showToast,
    }),
    [
      projects,
      activeProject,
      activeProjectId,
      isLoading,
      error,
      fetchProjects,
      setActiveProjectId,
      createProject,
      updateProject,
      deleteProject,
      showToast,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
      <AreaToast toast={toast} onDismiss={dismissToast} />
    </ProjectContext.Provider>
  );
}

