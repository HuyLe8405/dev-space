'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import type { WorkspaceColor, WorkspaceIcon } from '@devspace/contracts';
import { useWorkspaces } from '../hooks/use-workspaces';
import { useFocusTrap } from '../hooks/use-focus-trap';
import { IconPicker } from './icon-picker';
import { ColorPicker } from './color-picker';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newWorkspaceId: string) => void;
}

export function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { createWorkspace } = useWorkspaces();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<WorkspaceIcon>('Briefcase');
  const [color, setColor] = useState<WorkspaceColor>('blue');
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
      setIcon('Briefcase');
      setColor('blue');
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

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Workspace name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await createWorkspace({
        name: trimmed,
        description: description.trim() || undefined,
        icon,
        color,
      });

      onClose();
      if (onSuccess) {
        onSuccess(created.id);
      } else {
        router.push(`/workspaces/${created.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      aria-describedby="create-workspace-desc"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl z-10 space-y-4 sm:space-y-5 my-auto"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <h2
              id="create-workspace-title"
              className="text-base font-semibold text-foreground tracking-tight"
            >
              Create Workspace
            </h2>
            <p
              id="create-workspace-desc"
              className="text-xs text-muted-foreground mt-0.5"
            >
              Workspaces help you group and visualize related areas and projects.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="workspace-name"
                className="block text-xs font-medium text-muted-foreground"
              >
                Name <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground/80">
                {name.length}/50
              </span>
            </div>
            <input
              ref={inputRef}
              id="workspace-name"
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal Projects, Engineering, Study"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <IconPicker value={icon} onChange={setIcon} />

          <ColorPicker value={color} onChange={setColor} />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="workspace-description"
                className="block text-xs font-medium text-muted-foreground"
              >
                Description <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <span className="text-[11px] text-muted-foreground/80">
                {description.length}/280
              </span>
            </div>
            <textarea
              id="workspace-description"
              rows={2}
              maxLength={280}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this workspace's purpose..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
