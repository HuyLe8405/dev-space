'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { WORKSPACE_COLORS, WorkspaceColor } from '@devspace/contracts';

export const COLOR_CONFIG: Record<
  WorkspaceColor,
  { label: string; swatch: string; text: string; bg: string; border: string }
> = {
  slate: {
    label: 'Slate',
    swatch: 'bg-slate-400',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/40',
  },
  blue: {
    label: 'Blue',
    swatch: 'bg-sky-400',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/40',
  },
  indigo: {
    label: 'Indigo',
    swatch: 'bg-indigo-400',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
  },
  purple: {
    label: 'Purple',
    swatch: 'bg-purple-400',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
  },
  emerald: {
    label: 'Emerald',
    swatch: 'bg-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
  },
  amber: {
    label: 'Amber',
    swatch: 'bg-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
  },
  rose: {
    label: 'Rose',
    swatch: 'bg-rose-400',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
  },
  cyan: {
    label: 'Cyan',
    swatch: 'bg-cyan-400',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/40',
  },
};

interface ColorPickerProps {
  value: WorkspaceColor;
  onChange: (color: WorkspaceColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    const total = WORKSPACE_COLORS.length;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % total;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + total) % total;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = total - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextColor = WORKSPACE_COLORS[nextIndex];
      onChange(nextColor);
      const target = document.querySelector<HTMLButtonElement>(
        `[data-color-radio="${nextColor}"]`,
      );
      target?.focus();
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        Accent Color
      </label>
      <div
        role="radiogroup"
        aria-label="Select workspace color"
        className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/60 overflow-x-auto"
      >
        {WORKSPACE_COLORS.map((colorName, index) => {
          const config = COLOR_CONFIG[colorName];
          const isSelected = value === colorName;

          return (
            <button
              key={colorName}
              type="button"
              role="radio"
              data-color-radio={colorName}
              tabIndex={isSelected ? 0 : -1}
              aria-checked={isSelected}
              aria-label={config.label}
              onClick={() => onChange(colorName)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative w-7 h-7 min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background after:absolute after:-inset-1.5 after:content-[''] sm:after:hidden cursor-pointer ${
                config.swatch
              } ${
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                  : 'hover:opacity-85'
              }`}
            >
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-slate-950 font-bold" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
