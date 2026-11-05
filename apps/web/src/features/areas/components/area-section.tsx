'use client';

import React, { useState } from 'react';
import { useAreas } from '../hooks/use-areas';
import { AreaNavigationStrip } from './area-navigation-strip';
import { AreaCanvas } from './area-canvas';
import { WorkspaceEmptyAreasState } from './workspace-empty-areas-state';
import { AreaLoadingSkeleton } from './area-loading-skeleton';
import { AreaErrorState } from './area-error-state';
import { EditAreaDialog } from './edit-area-dialog';
import { DeleteAreaDialog } from './delete-area-dialog';

interface AreaSectionProps {
  workspaceName?: string;
}

export function AreaSection({ workspaceName }: AreaSectionProps) {
  const { areas, activeArea, activeAreaId, isLoading, error, refreshAreas } = useAreas();
  const [editingArea, setEditingArea] = useState<typeof activeArea>(null);
  const [deletingArea, setDeletingArea] = useState<typeof activeArea>(null);

  if (isLoading) {
    return <AreaLoadingSkeleton />;
  }

  if (error) {
    return <AreaErrorState error={error} onRetry={refreshAreas} />;
  }

  if (areas.length === 0) {
    return (
      <div className="space-y-6">
        <AreaNavigationStrip />
        <WorkspaceEmptyAreasState workspaceName={workspaceName} />
      </div>
    );
  }

  const activeIndex = areas.findIndex((a) => a.id === activeAreaId);
  const resolvedArea = activeArea || (areas.length > 0 ? areas[0] : null);

  return (
    <div className="space-y-6">
      <AreaNavigationStrip />

      {resolvedArea && (
        <AreaCanvas
          area={resolvedArea}
          index={activeIndex >= 0 ? activeIndex : 0}
          total={areas.length}
          onEdit={() => setEditingArea(resolvedArea)}
          onDelete={() => setDeletingArea(resolvedArea)}
        />
      )}

      {editingArea && (
        <EditAreaDialog
          area={editingArea}
          isOpen={Boolean(editingArea)}
          onClose={() => setEditingArea(null)}
        />
      )}

      {deletingArea && (
        <DeleteAreaDialog
          area={deletingArea}
          isOpen={Boolean(deletingArea)}
          onClose={() => setDeletingArea(null)}
        />
      )}
    </div>
  );
}
