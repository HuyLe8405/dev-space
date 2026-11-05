'use client';

import React, { useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { AreaDto } from '@devspace/contracts';
import { ICON_MAP } from '@/features/workspaces/components/icon-picker';
import { COLOR_CONFIG } from '@/features/workspaces/components/color-picker';

interface AreaTabItemProps {
  area: AreaDto;
  isActive: boolean;
  index: number;
  total: number;
  onSelect: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onDragStart?: (index: number) => void;
  onDragEnter?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function AreaTabItem({
  area,
  isActive,
  index,
  total,
  onSelect,
  onMoveLeft,
  onMoveRight,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging = false,
}: AreaTabItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const tabRef = useRef<HTMLButtonElement>(null);

  const IconComponent = ICON_MAP[area.icon] || ICON_MAP.Layers;
  const colorConfig = COLOR_CONFIG[area.color] || COLOR_CONFIG.indigo;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      if (onMoveLeft && index > 0) {
        onMoveLeft();
        setStatusAnnouncement(`Moved ${area.name} to position ${index} of ${total}`);
      }
    } else if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      if (onMoveRight && index < total - 1) {
        onMoveRight();
        setStatusAnnouncement(`Moved ${area.name} to position ${index + 2} of ${total}`);
      }
    }
  };

  return (
    <div
      role="presentation"
      className="relative flex items-center shrink-0 group"
      draggable
      onDragStart={() => onDragStart?.(index)}
      onDragEnter={() => onDragEnter?.(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className={`relative flex items-center rounded-lg transition-all duration-150 min-h-[36px] ${
          isDragging
            ? 'opacity-40 scale-98 ring-1 ring-primary/40'
            : isActive
            ? 'bg-card border border-border shadow-sm'
            : 'border border-transparent hover:bg-muted/40 hover:text-foreground text-muted-foreground'
        }`}
      >
        {/* Drag Handle */}
        <div
          role="button"
          tabIndex={-1}
          aria-label={`Drag to reorder ${area.name}`}
          className="pl-2 pr-1 py-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors flex items-center"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Tab Selection Button */}
        <button
          ref={tabRef}
          type="button"
          role="tab"
          id={`area-tab-${area.id}`}
          aria-selected={isActive}
          aria-controls={`area-panel-${area.id}`}
          aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
          aria-describedby={`area-shortcut-${area.id}`}
          tabIndex={isActive ? 0 : -1}
          onClick={onSelect}
          onKeyDown={handleKeyDown}
          title={area.name}
          className="flex items-center gap-2 pl-0.5 pr-3 py-2 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-r-lg select-none"
        >
          <IconComponent
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isActive ? colorConfig.text : 'text-muted-foreground'
            }`}
          />
          <span
            className={`truncate max-w-[120px] sm:max-w-[170px] ${
              isActive ? 'font-semibold text-foreground' : 'font-medium'
            }`}
          >
            {area.name}
          </span>
          <span id={`area-shortcut-${area.id}`} className="sr-only">
            Use Alt+ArrowLeft or Alt+ArrowRight to reorder
          </span>
        </button>

        {/* Active bottom indicator pill */}
        {isActive && (
          <div
            className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${colorConfig.swatch}`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Screen Reader Live Position Announcement */}
      <span className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </span>

      {/* Reorder Helper Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 text-[10px] font-medium text-foreground bg-card border border-border rounded shadow-md pointer-events-none whitespace-nowrap"
        >
          Drag to reorder, or use Alt+Left/Right
        </div>
      )}
    </div>
  );
}
