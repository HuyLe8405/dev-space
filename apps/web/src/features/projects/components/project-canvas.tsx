'use client';

import React, { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { AreaDto, ProjectDto } from '@devspace/contracts';
import { ICON_MAP } from '@/features/workspaces/components/icon-picker';
import { COLOR_CONFIG } from '@/features/workspaces/components/color-picker';
import { useProjects } from '../hooks/use-projects';
import { EditProjectDialog } from './edit-project-dialog';
import { DeleteProjectDialog } from './delete-project-dialog';
import { NodeSection } from '@/features/nodes';

interface ProjectCanvasProps {
  project: ProjectDto;
  area: AreaDto;
  children?: React.ReactNode;
}

export function ProjectCanvas({
  project,
  area,
  children,
}: ProjectCanvasProps) {
  const { setActiveProjectId } = useProjects();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const IconComponent = ICON_MAP[project.icon] || ICON_MAP.Folder;
  const colorConfig = COLOR_CONFIG[project.color] || COLOR_CONFIG.cyan;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveProjectId(null)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <span aria-hidden="true" className="select-none text-muted-foreground">/</span>

          <span className="text-muted-foreground font-medium truncate max-w-[150px]">
            {area.name}
          </span>

          <span aria-hidden="true" className="select-none text-muted-foreground">/</span>

          <span className="text-foreground font-semibold truncate max-w-[200px]">
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Project Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-sm`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold tracking-tight text-foreground truncate">
                {project.name}
              </h2>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 shrink-0">
                {project.nodeCount} {project.nodeCount === 1 ? 'node' : 'nodes'}
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Node Management Canvas Container */}
      {children || (
        <NodeSection
          project={project}
          workspaceId={area.workspaceId}
          areaId={area.id}
        />
      )}

      {/* Dialogs */}
      {isEditOpen && (
        <EditProjectDialog
          project={project}
          isOpen={true}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isDeleteOpen && (
        <DeleteProjectDialog
          project={project}
          isOpen={true}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => setActiveProjectId(null)}
        />
      )}
    </div>
  );
}
