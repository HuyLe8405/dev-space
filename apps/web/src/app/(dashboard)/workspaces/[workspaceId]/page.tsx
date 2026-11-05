'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { WorkspaceOverview } from '@/features/workspaces/components/workspace-overview';
import { WorkspaceNotFound } from '@/features/workspaces/components/workspace-not-found';
import { WorkspaceErrorState } from '@/features/workspaces/components/workspace-error-state';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;

  const {
    workspaces,
    isLoading,
    error,
    refreshWorkspaces,
    setActiveWorkspaceId,
  } = useWorkspaces();

  const workspace = workspaceId
    ? workspaces.find((w) => w.id === workspaceId) || null
    : null;

  useEffect(() => {
    if (workspace) {
      setActiveWorkspaceId(workspace.id);
    }
  }, [workspace, setActiveWorkspaceId]);

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center p-8"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading workspace details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <WorkspaceErrorState
        title="Unable to Load Workspace"
        error={error}
        onRetry={refreshWorkspaces}
      />
    );
  }

  if (!workspace) {
    return <WorkspaceNotFound />;
  }

  return <WorkspaceOverview workspace={workspace} />;
}
