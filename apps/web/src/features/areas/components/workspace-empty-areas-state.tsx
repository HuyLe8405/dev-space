'use client';

import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { CreateAreaDialog } from './create-area-dialog';

interface WorkspaceEmptyAreasStateProps {
  workspaceName?: string;
}

export function WorkspaceEmptyAreasState({
  workspaceName,
}: WorkspaceEmptyAreasStateProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 p-12 text-center flex flex-col items-center justify-center min-h-[340px] animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center text-primary/70 mb-4 shadow-sm">
        <Layers className="w-7 h-7" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
        No Areas in {workspaceName || 'this Workspace'}
      </h3>

      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-6">
        Areas help you organize functional domains within your workspace, such as Frontend, Backend, or Research.
      </p>

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 min-h-[36px] text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <Plus className="w-4 h-4" />
        <span>Create First Area</span>
      </button>

      <CreateAreaDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
