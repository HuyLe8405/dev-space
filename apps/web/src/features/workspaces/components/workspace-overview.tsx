'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Layers, Clock } from 'lucide-react';
import type { WorkspaceDto } from '@devspace/contracts';
import { ICON_MAP } from './icon-picker';
import { COLOR_CONFIG } from './color-picker';
import { EditWorkspaceDialog } from './edit-workspace-dialog';
import { DeleteWorkspaceDialog } from './delete-workspace-dialog';

interface WorkspaceOverviewProps {
  workspace: WorkspaceDto;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}

export function WorkspaceOverview({ workspace }: WorkspaceOverviewProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const IconComponent = ICON_MAP[workspace.icon] || ICON_MAP.Briefcase;
  const colorConfig = COLOR_CONFIG[workspace.color] || COLOR_CONFIG.blue;

  const handleDeleteSuccess = () => {
    router.push('/workspaces');
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-150">
      {/* Context Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <ol className="flex items-center gap-1.5 list-none p-0 m-0">
          <li>
            <span>Workspaces</span>
          </li>
          <li aria-hidden="true" className="select-none text-muted-foreground/60">
            /
          </li>
          <li>
            <span aria-current="page" className="text-foreground font-medium">
              {workspace.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Identity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/80">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-sm`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {workspace.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {formatRelativeTime(workspace.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/50 text-foreground transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Calm 2D Spatial Container (Preparing for future Areas) */}
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground/60 mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Workspace Canvas
        </h3>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          Areas will appear here as you structure your workspace into domains. In future updates, this canvas will expand into interactive 3D knowledge islands.
        </p>
      </div>

      {/* Dialogs */}
      <EditWorkspaceDialog
        workspace={workspace}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <DeleteWorkspaceDialog
        workspace={workspace}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
