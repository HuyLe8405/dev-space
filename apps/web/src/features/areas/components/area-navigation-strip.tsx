'use client';

import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useAreas } from '../hooks/use-areas';
import { AreaTabItem } from './area-tab-item';
import { CreateAreaDialog } from './create-area-dialog';

export function AreaNavigationStrip() {
  const { areas, activeAreaId, setActiveAreaId, reorderAreas } = useAreas();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...areas];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setDraggedIndex(targetIndex);
    reorderAreas(reordered.map((a) => a.id)).catch(() => {
      // Rollback is handled in context
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= areas.length) return;
    const reordered = [...areas];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    reorderAreas(reordered.map((a) => a.id)).catch(() => {
      // Rollback handled in context
    });
  };

  const handleTablistKeyDown = (e: React.KeyboardEvent) => {
    const tabs = scrollContainerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;

    const currentIndex = Array.from(tabs).findIndex((t) => t === document.activeElement);
    if (currentIndex === -1) return;

    if (!e.altKey) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[prevIndex].focus();
        tabs[prevIndex].click();
      } else if (e.key === 'Home') {
        e.preventDefault();
        tabs[0].focus();
        tabs[0].click();
      } else if (e.key === 'End') {
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        tabs[tabs.length - 1].click();
      }
    }
  };

  return (
    <div className="relative flex items-center justify-between gap-2 border-b border-border/70 pb-2">
      {/* Scrollable Tablist with overflow */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Workspace Areas"
          onKeyDown={handleTablistKeyDown}
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {areas.map((area, index) => (
            <AreaTabItem
              key={area.id}
              area={area}
              isActive={area.id === activeAreaId}
              index={index}
              total={areas.length}
              onSelect={() => setActiveAreaId(area.id)}
              onMoveLeft={() => moveItem(index, index - 1)}
              onMoveRight={() => moveItem(index, index + 1)}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          ))}
        </div>

        {/* Trailing edge gradient mask for overflow cue */}
        <div
          className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-l from-background to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Subtle vertical divider */}
      <div className="h-5 w-px bg-border/60 shrink-0" aria-hidden="true" />

      {/* Pinned persistent + New Area Button */}
      <div className="shrink-0 pl-1">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          <span>New Area</span>
        </button>
      </div>

      {/* Create Area Dialog */}
      <CreateAreaDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
