'use client';

import React from 'react';
import { Pencil, Trash2, FolderKanban } from 'lucide-react';
import type { AreaDto } from '@devspace/contracts';
import { ICON_MAP } from '@/features/workspaces/components/icon-picker';
import { COLOR_CONFIG } from '@/features/workspaces/components/color-picker';

interface AreaCanvasProps {
  area: AreaDto;
  index: number;
  total: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AreaCanvas({
  area,
  index,
  total,
  onEdit,
  onDelete,
}: AreaCanvasProps) {
  const IconComponent = ICON_MAP[area.icon] || ICON_MAP.Layers;
  const colorConfig = COLOR_CONFIG[area.color] || COLOR_CONFIG.indigo;

  return (
    <div
      role="tabpanel"
      id={`area-panel-${area.id}`}
      aria-labelledby={`area-tab-${area.id}`}
      className="space-y-6 animate-in fade-in duration-150"
    >
      {/* Streamlined Domain Status Bar (Compact 48px visual hierarchy) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
        {/* Left Cluster: Icon Badge, Title, Sequence Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-sm`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <h2
              title={area.name}
              className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md"
            >
              {area.name}
            </h2>

            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 shrink-0">
              Area {index + 1} of {total}
            </span>
          </div>

          {area.description && (
            <p
              title={area.description}
              className="text-xs text-muted-foreground truncate max-w-sm hidden lg:block border-l border-border/60 pl-3"
            >
              {area.description}
            </p>
          )}
        </div>

        {/* Right Cluster: Scoped Area Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-1 min-h-[32px] sm:min-h-0 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Area</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-1 min-h-[32px] sm:min-h-0 text-xs font-medium rounded-md text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Area</span>
            </button>
          )}
        </div>
      </div>

      {/* Future Project Staging Canvas (2D-first calm container) */}
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground/60 mb-3">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {area.name} Canvas
        </h3>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          Projects and resources inside this area will be staged here. In future updates, this canvas will expand into interactive 3D structures.
        </p>
      </div>
    </div>
  );
}
