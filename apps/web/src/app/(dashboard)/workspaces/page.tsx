'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { OnboardingEmptyState } from '@/features/workspaces/components/empty-state';
import { WorkspaceErrorState } from '@/features/workspaces/components/workspace-error-state';

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, activeWorkspace, isLoading, error, refreshWorkspaces } =
    useWorkspaces();

  useEffect(() => {
    if (isLoading || error) return;

    if (workspaces.length > 0) {
      const storedId =
        typeof window !== 'undefined'
          ? localStorage.getItem('devspace:last_workspace_id')
          : null;

      const targetId =
        (storedId && workspaces.some((w) => w.id === storedId) ? storedId : null) ||
        activeWorkspace?.id ||
        workspaces[0].id;

      router.replace(`/workspaces/${targetId}`);
    }
  }, [isLoading, error, workspaces, activeWorkspace, router]);

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center p-8"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading workspaces...</span>
      </div>
    );
  }

  if (error) {
    return (
      <WorkspaceErrorState
        title="Unable to Load Workspaces"
        error={error}
        onRetry={refreshWorkspaces}
      />
    );
  }

  if (workspaces.length === 0) {
    return <OnboardingEmptyState />;
  }

  return (
    <div
      role="status"
      className="flex-1 flex items-center justify-center p-8"
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Navigating to active workspace...</span>
    </div>
  );
}
