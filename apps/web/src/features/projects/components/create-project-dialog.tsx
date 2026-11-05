'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';
import { useProjects } from '../hooks/use-projects';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';
import { IconPicker } from '@/features/workspaces/components/icon-picker';
import { ColorPicker, COLOR_CONFIG } from '@/features/workspaces/components/color-picker';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProjectId: string) => void;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectDialogProps) {
  const { projects, createProject } = useProjects();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<WorkspaceIcon>(DEFAULT_PROJECT_ICON);
  const [color, setColor] = useState<WorkspaceColor>(DEFAULT_PROJECT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(isOpen, dialogRef, inputRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIcon(DEFAULT_PROJECT_ICON);
      setColor(DEFAULT_PROJECT_COLOR);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const trimmedName = name.trim();
  const isDuplicateName = Boolean(
    trimmedName &&
      projects.some(
        (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      ),
  );

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) {
      setError('Project name is required');
      return;
    }

    if (isDuplicateName) {
      setError(`A project with the name "${trimmedName}" already exists in this area`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await createProject({
        name: trimmedName,
        description: description.trim() || undefined,
        icon,
        color,
      });

      onClose();
      if (onSuccess) {
        onSuccess(created.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentColorConfig = COLOR_CONFIG[color] || COLOR_CONFIG.cyan;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      aria-labelledby="create-project-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 id="create-project-title" className="text-base font-semibold text-foreground">
              Create New Project
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize nodes and architecture concepts within this area
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative rounded-lg p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="project-name-input"
              className="text-xs font-medium text-foreground flex justify-between"
            >
              <span>Project Name *</span>
              <span className="text-[11px] text-muted-foreground">
                {name.length}/50
              </span>
            </label>
            <input
              ref={inputRef}
              id="project-name-input"
              type="text"
              required
              maxLength={50}
              placeholder="e.g. DevSpace API"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border ${
                isDuplicateName
                  ? 'border-rose-500/70 focus:ring-rose-500/30'
                  : 'border-border/80 focus:ring-primary/30'
              } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`}
            />
            {isDuplicateName && (
              <p className="text-[11px] text-rose-400">
                A project with this name already exists in this area
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-description-input"
              className="text-xs font-medium text-foreground flex justify-between"
            >
              <span>Description (Optional)</span>
              <span className="text-[11px] text-muted-foreground">
                {description.length}/280
              </span>
            </label>
            <textarea
              id="project-description-input"
              rows={2}
              maxLength={280}
              placeholder="Brief summary of this project's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Icon
            </label>
            <div className="p-2 rounded-xl bg-muted/20 border border-border/60">
              <IconPicker
                value={icon}
                onChange={setIcon}
                accentColorClass={currentColorConfig.text}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Theme Color
            </label>
            <div className="p-2 rounded-xl bg-muted/20 border border-border/60">
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !trimmedName || isDuplicateName}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

