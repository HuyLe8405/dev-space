'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, MoreVertical, Boxes } from 'lucide-react';
import type { ProjectDto } from '@devspace/contracts';
import { ICON_MAP } from '@/features/workspaces/components/icon-picker';
import { COLOR_CONFIG } from '@/features/workspaces/components/color-picker';

interface ProjectCardProps {
  project: ProjectDto;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export function ProjectCard({
  project,
  onSelect,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const IconComponent = ICON_MAP[project.icon] || ICON_MAP.Folder;
  const colorConfig = COLOR_CONFIG[project.color] || COLOR_CONFIG.cyan;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent selection if clicked on action button or menu
    if ((e.target as HTMLElement).closest('[data-action="true"]')) {
      return;
    }
    onSelect();
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative group rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 hover:border-border hover:bg-card/90 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between min-h-[148px] text-left"
    >
      {/* Header Row: Icon Badge & Action Menu */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-sm group-hover:scale-105 transition-transform`}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Quick action buttons on hover / focus */}
        <div
          data-action="true"
          className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit project"
            aria-label={`Edit ${project.name}`}
            className="relative p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete project"
            aria-label={`Delete ${project.name}`}
            className="relative p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body: Title and Description */}
      <div className="space-y-1 mb-3 flex-1 min-w-0">
        <h3
          title={project.name}
          className="text-sm font-semibold tracking-tight text-foreground truncate"
        >
          <button
            type="button"
            onClick={onSelect}
            aria-label={`Open project ${project.name}`}
            className="text-left font-semibold text-foreground group-hover:text-primary transition-colors truncate hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs cursor-pointer max-w-full block"
          >
            {project.name}
          </button>
        </h3>
        <p
          title={project.description || ''}
          className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
        >
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Row: Node count pill & Updated timestamp */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 text-foreground">
          <Boxes className="w-3 h-3 text-muted-foreground" />
          <span>
            {project.nodeCount} {project.nodeCount === 1 ? 'node' : 'nodes'}
          </span>
        </span>

        <span title={new Date(project.updatedAt).toLocaleString()}>
          Updated {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

