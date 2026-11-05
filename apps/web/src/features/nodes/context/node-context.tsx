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
  NodeDto,
  CreateNodeRequest,
  UpdateNodeRequest,
  NodeListResponse,
  NodeRelationshipDto,
  CreateNodeRelationshipRequest,
  UpdateNodeRelationshipRequest,
  NodeRelationshipListResponse,
} from '@devspace/contracts';
import { apiClient } from '@/lib/api-client';
import { AreaToast, type ToastMessage } from '@/features/areas/components/area-toast';

export interface NodeContextValue {
  nodes: NodeDto[];
  relationships: NodeRelationshipDto[];
  isLoading: boolean;
  error: string | null;
  refreshNodes: () => Promise<void>;
  refreshRelationships: () => Promise<void>;
  createNode: (dto: CreateNodeRequest) => Promise<NodeDto>;
  updateNode: (id: string, dto: UpdateNodeRequest) => Promise<NodeDto>;
  deleteNode: (id: string) => Promise<void>;
  createRelationship: (dto: CreateNodeRelationshipRequest) => Promise<NodeRelationshipDto>;
  updateRelationship: (id: string, dto: UpdateNodeRelationshipRequest) => Promise<NodeRelationshipDto>;
  deleteRelationship: (id: string) => Promise<void>;
  getConnectionCount: (nodeId: string) => number;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NodeContext = createContext<NodeContextValue | undefined>(undefined);

export function NodeProvider({
  workspaceId,
  areaId,
  projectId,
  children,
}: {
  workspaceId: string;
  areaId: string;
  projectId: string;
  children: React.ReactNode;
}) {
  const [nodes, setNodes] = useState<NodeDto[]>([]);
  const [relationships, setRelationships] = useState<NodeRelationshipDto[]>([]);
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

  const basePath = `/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}`;

  const fetchNodes = useCallback(async () => {
    if (!workspaceId || !areaId || !projectId) {
      setNodes([]);
      return;
    }
    const res = await apiClient<NodeListResponse>(`${basePath}/nodes`);
    setNodes(res.items);
  }, [basePath, workspaceId, areaId, projectId]);

  const fetchRelationships = useCallback(async () => {
    if (!workspaceId || !areaId || !projectId) {
      setRelationships([]);
      return;
    }
    const res = await apiClient<NodeRelationshipListResponse>(`${basePath}/relationships`);
    setRelationships(res.items);
  }, [basePath, workspaceId, areaId, projectId]);

  const loadAll = useCallback(async () => {
    if (!workspaceId || !areaId || !projectId) {
      setNodes([]);
      setRelationships([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchNodes(), fetchRelationships()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load project nodes';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, areaId, projectId, fetchNodes, fetchRelationships]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Node CRUD
  const createNode = useCallback(
    async (dto: CreateNodeRequest): Promise<NodeDto> => {
      setError(null);
      const newNode = await apiClient<NodeDto>(`${basePath}/nodes`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      setNodes((prev) => [...prev, newNode]);
      showToast(`Node "${newNode.name}" created`, 'success');
      return newNode;
    },
    [basePath, showToast],
  );

  const updateNode = useCallback(
    async (id: string, dto: UpdateNodeRequest): Promise<NodeDto> => {
      setError(null);
      const updated = await apiClient<NodeDto>(`${basePath}/nodes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      setNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      showToast(`Node "${updated.name}" updated`, 'success');
      return updated;
    },
    [basePath, showToast],
  );

  const deleteNode = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await apiClient<void>(`${basePath}/nodes/${id}`, {
        method: 'DELETE',
      });
      setNodes((prev) => prev.filter((n) => n.id !== id));
      // Remove any relationships connecting this node
      setRelationships((prev) =>
        prev.filter((r) => r.sourceNodeId !== id && r.targetNodeId !== id),
      );
      showToast('Node deleted', 'info');
    },
    [basePath, showToast],
  );

  // Relationship CRUD
  const createRelationship = useCallback(
    async (dto: CreateNodeRelationshipRequest): Promise<NodeRelationshipDto> => {
      setError(null);
      const newRel = await apiClient<NodeRelationshipDto>(`${basePath}/relationships`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      setRelationships((prev) => [...prev, newRel]);
      showToast('Connection created', 'success');
      return newRel;
    },
    [basePath, showToast],
  );

  const updateRelationship = useCallback(
    async (id: string, dto: UpdateNodeRelationshipRequest): Promise<NodeRelationshipDto> => {
      setError(null);
      const updated = await apiClient<NodeRelationshipDto>(
        `${basePath}/relationships/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
      setRelationships((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast('Connection updated', 'success');
      return updated;
    },
    [basePath, showToast],
  );

  const deleteRelationship = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await apiClient<void>(`${basePath}/relationships/${id}`, {
        method: 'DELETE',
      });
      setRelationships((prev) => prev.filter((r) => r.id !== id));
      showToast('Connection removed', 'info');
    },
    [basePath, showToast],
  );

  const getConnectionCount = useCallback(
    (nodeId: string): number => {
      return relationships.filter(
        (r) => r.sourceNodeId === nodeId || r.targetNodeId === nodeId,
      ).length;
    },
    [relationships],
  );

  const value = useMemo(
    () => ({
      nodes,
      relationships,
      isLoading,
      error,
      refreshNodes: fetchNodes,
      refreshRelationships: fetchRelationships,
      createNode,
      updateNode,
      deleteNode,
      createRelationship,
      updateRelationship,
      deleteRelationship,
      getConnectionCount,
      showToast,
    }),
    [
      nodes,
      relationships,
      isLoading,
      error,
      fetchNodes,
      fetchRelationships,
      createNode,
      updateNode,
      deleteNode,
      createRelationship,
      updateRelationship,
      deleteRelationship,
      getConnectionCount,
      showToast,
    ],
  );

  return (
    <NodeContext.Provider value={value}>
      {children}
      <AreaToast toast={toast} onDismiss={dismissToast} />
    </NodeContext.Provider>
  );
}

