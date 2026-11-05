'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type {
  AreaDto,
  CreateAreaRequest,
  UpdateAreaRequest,
  ReorderAreasRequest,
  AreaListResponse,
} from '@devspace/contracts';
import { apiClient } from '@/lib/api-client';
import { AreaToast, type ToastMessage } from '../components/area-toast';

export interface AreaContextValue {
  areas: AreaDto[];
  activeArea: AreaDto | null;
  activeAreaId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshAreas: () => Promise<void>;
  setActiveAreaId: (id: string | null) => void;
  createArea: (dto: CreateAreaRequest) => Promise<AreaDto>;
  updateArea: (id: string, dto: UpdateAreaRequest) => Promise<AreaDto>;
  deleteArea: (id: string) => Promise<void>;
  reorderAreas: (areaIds: string[]) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AreaContext = createContext<AreaContextValue | undefined>(undefined);

export function AreaProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [activeAreaId, setActiveAreaIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const storageKey = `devspace:last_area_${workspaceId}`;
  const initialSyncDone = useRef(false);

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

  const fetchAreas = useCallback(async () => {
    if (!workspaceId) {
      setAreas([]);
      setActiveAreaIdState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<AreaListResponse>(
        `/workspaces/${workspaceId}/areas`,
      );
      setAreas(res.items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch areas';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  // URL query and localStorage selection synchronization
  useEffect(() => {
    if (isLoading) return;

    const queryAreaId = searchParams.get('area');

    if (areas.length === 0) {
      setActiveAreaIdState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
      if (queryAreaId) {
        router.replace(pathname, { scroll: false });
      }
      return;
    }

    // If query param is present and matches an area
    if (queryAreaId && areas.some((a) => a.id === queryAreaId)) {
      setActiveAreaIdState(queryAreaId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, queryAreaId);
      }
      return;
    }

    // If query param is present but invalid/not found (User Story 5 fallback)
    if (queryAreaId && !areas.some((a) => a.id === queryAreaId)) {
      const fallbackArea = areas[0];
      setActiveAreaIdState(fallbackArea.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, fallbackArea.id);
      }
      router.replace(`${pathname}?area=${fallbackArea.id}`, { scroll: false });
      showToast('Requested area was not found. Selected first available area.', 'info');
      return;
    }

    // No query param in URL: inspect localStorage or default to first area
    let targetId: string = areas[0].id;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(storageKey);
      if (storedId && areas.some((a) => a.id === storedId)) {
        targetId = storedId;
      }
    }

    if (activeAreaId !== targetId) {
      setActiveAreaIdState(targetId);
    }
    if (queryAreaId !== targetId) {
      router.replace(`${pathname}?area=${targetId}`, { scroll: false });
    }
  }, [areas, isLoading, searchParams, pathname, router, storageKey, showToast, activeAreaId]);

  const activeArea = useMemo(() => {
    if (!activeAreaId) return null;
    return areas.find((a) => a.id === activeAreaId) || null;
  }, [areas, activeAreaId]);

  const setActiveAreaId = useCallback(
    (id: string | null) => {
      setActiveAreaIdState(id);
      if (typeof window !== 'undefined') {
        if (id) {
          localStorage.setItem(storageKey, id);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
      if (id) {
        router.replace(`${pathname}?area=${id}`, { scroll: false });
      } else {
        router.replace(pathname, { scroll: false });
      }
    },
    [pathname, router, storageKey],
  );

  const createArea = useCallback(
    async (dto: CreateAreaRequest): Promise<AreaDto> => {
      setError(null);
      const newArea = await apiClient<AreaDto>(
        `/workspaces/${workspaceId}/areas`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      setAreas((prev) => [...prev, newArea]);
      setActiveAreaId(newArea.id);
      showToast(`Area "${newArea.name}" created`, 'success');
      return newArea;
    },
    [workspaceId, setActiveAreaId, showToast],
  );

  const updateArea = useCallback(
    async (id: string, dto: UpdateAreaRequest): Promise<AreaDto> => {
      setError(null);
      const updated = await apiClient<AreaDto>(
        `/workspaces/${workspaceId}/areas/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
      setAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Area "${updated.name}" updated`, 'success');
      return updated;
    },
    [workspaceId, showToast],
  );

  const deleteArea = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await apiClient<void>(`/workspaces/${workspaceId}/areas/${id}`, {
        method: 'DELETE',
      });
      setAreas((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        if (activeAreaId === id) {
          const nextActive = remaining.length > 0 ? remaining[0].id : null;
          setActiveAreaId(nextActive);
        }
        return remaining;
      });
      showToast('Area deleted', 'info');
    },
    [workspaceId, activeAreaId, setActiveAreaId, showToast],
  );

  const reorderAreas = useCallback(
    async (areaIds: string[]): Promise<void> => {
      setError(null);
      const previous = [...areas];
      const map = new Map(areas.map((a) => [a.id, a]));
      const nextAreas = areaIds.map((id, index) => ({
        ...map.get(id)!,
        order: index,
      }));
      setAreas(nextAreas);

      try {
        await apiClient<AreaListResponse>(
          `/workspaces/${workspaceId}/areas/reorder`,
          {
            method: 'PUT',
            body: JSON.stringify({ areaIds } as ReorderAreasRequest),
          },
        );
      } catch (err) {
        setAreas(previous);
        const msg = err instanceof Error ? err.message : 'Failed to reorder areas';
        setError(msg);
        showToast(msg, 'error');
        throw err;
      }
    },
    [workspaceId, areas, showToast],
  );

  const value = useMemo(
    () => ({
      areas,
      activeArea,
      activeAreaId,
      isLoading,
      error,
      refreshAreas: fetchAreas,
      setActiveAreaId,
      createArea,
      updateArea,
      deleteArea,
      reorderAreas,
      showToast,
    }),
    [
      areas,
      activeArea,
      activeAreaId,
      isLoading,
      error,
      fetchAreas,
      setActiveAreaId,
      createArea,
      updateArea,
      deleteArea,
      reorderAreas,
      showToast,
    ],
  );

  return (
    <AreaContext.Provider value={value}>
      {children}
      <AreaToast toast={toast} onDismiss={dismissToast} />
    </AreaContext.Provider>
  );
}

export function useAreas() {
  const context = useContext(AreaContext);
  if (!context) {
    throw new Error('useAreas must be used within an AreaProvider');
  }
  return context;
}
