'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import type { AreaDto, WorkspaceColor, WorkspaceIcon } from '@devspace/contracts';
import { useAreas } from '../hooks/use-areas';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';
import { IconPicker } from '@/features/workspaces/components/icon-picker';
import { ColorPicker } from '@/features/workspaces/components/color-picker';

interface EditAreaDialogProps {
  area: AreaDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditAreaDialog({
  area,
  isOpen,
  onClose,
  onSuccess,
}: EditAreaDialogProps) {
  const { areas, updateArea } = useAreas();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(area.name);
  const [description, setDescription] = useState(area.description || '');
  const [icon, setIcon] = useState<WorkspaceIcon>(area.icon);
  const [color, setColor] = useState<WorkspaceColor>(area.color);
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
      setName(area.name);
      setDescription(area.description || '');
      setIcon(area.icon);
      setColor(area.color);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, area]);

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
      areas.some(
        (a) =>
          a.id !== area.id &&
          a.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      ),
  );

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) {
      setError('Area name is required');
      return;
    }

    if (isDuplicateName) {
      setError(`An area with the name "${trimmedName}" already exists in this workspace`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateArea(area.id, {
        name: trimmedName,
        description: description.trim() || null,
        icon,
        color,
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update area';
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
      aria-labelledby="edit-area-title"
      aria-describedby="edit-area-desc"
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
              id="edit-area-title"
              className="text-base font-semibold text-foreground tracking-tight"
            >
              Edit Area
            </h2>
            <p
              id="edit-area-desc"
              className="text-xs text-muted-foreground mt-0.5"
            >
              Update identity, icon, accent color, and purpose.
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
                htmlFor="edit-area-name"
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
              id="edit-area-name"
              type="text"
              required
              maxLength={50}
              value={name}
              aria-invalid={isDuplicateName ? 'true' : 'false'}
              aria-describedby={isDuplicateName ? 'edit-area-name-error' : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full h-9 rounded-lg border px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-all ${
                isDuplicateName
                  ? 'border-rose-500/60 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-border bg-background focus:border-primary focus:ring-primary'
              }`}
            />
            {isDuplicateName && (
              <p id="edit-area-name-error" role="alert" className="text-[11px] text-rose-400">
                An area with this name already exists in this workspace
              </p>
            )}
          </div>

          <IconPicker value={icon} onChange={setIcon} />

          <ColorPicker value={color} onChange={setColor} />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-area-description"
                className="block text-xs font-medium text-muted-foreground"
              >
                Description <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <span className="text-[11px] text-muted-foreground/80">
                {description.length}/280
              </span>
            </div>
            <textarea
              id="edit-area-description"
              rows={2}
              maxLength={280}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this area's purpose and scope..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !trimmedName || isDuplicateName}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[36px] text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
