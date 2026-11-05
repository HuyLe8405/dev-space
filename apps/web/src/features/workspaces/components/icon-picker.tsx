'use client';

import React from 'react';
import {
  Briefcase,
  Code,
  BookOpen,
  Terminal,
  Compass,
  Cpu,
  Layers,
  Boxes,
  Flame,
  Folder,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';
import { WORKSPACE_ICONS, WorkspaceIcon } from '@devspace/contracts';

export const ICON_MAP: Record<WorkspaceIcon, LucideIcon> = {
  Briefcase,
  Code,
  BookOpen,
  Terminal,
  Compass,
  Cpu,
  Layers,
  Boxes,
  Flame,
  Folder,
  Sparkles,
  User,
};

interface IconPickerProps {
  value: WorkspaceIcon;
  onChange: (icon: WorkspaceIcon) => void;
  accentColorClass?: string;
}

const GRID_COLS = 6;

export function IconPicker({ value, onChange, accentColorClass }: IconPickerProps) {
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    const total = WORKSPACE_ICONS.length;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % total;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + total) % total;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + GRID_COLS) % total;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - GRID_COLS + total) % total;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = total - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextIcon = WORKSPACE_ICONS[nextIndex];
      onChange(nextIcon);
      const target = document.querySelector<HTMLButtonElement>(
        `[data-icon-radio="${nextIcon}"]`,
      );
      target?.focus();
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        Icon
      </label>
      <div
        role="radiogroup"
        aria-label="Select workspace icon"
        className="grid grid-cols-6 gap-1.5 p-2 rounded-lg border border-border bg-card/60"
      >
        {WORKSPACE_ICONS.map((iconName, index) => {
          const IconComp = ICON_MAP[iconName];
          const isSelected = value === iconName;

          return (
            <button
              key={iconName}
              type="button"
              role="radio"
              data-icon-radio={iconName}
              tabIndex={isSelected ? 0 : -1}
              aria-checked={isSelected}
              aria-label={iconName}
              onClick={() => onChange(iconName)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center justify-center h-9 rounded-md transition-all focus:outline-none focus:ring-1 focus:ring-primary ${
                isSelected
                  ? 'bg-primary/20 border border-primary text-primary shadow-sm'
                  : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <IconComp
                className={`w-4 h-4 ${
                  isSelected && accentColorClass ? accentColorClass : ''
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
