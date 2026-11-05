'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { AreaDto } from '@devspace/contracts';
import { useAreas } from '../hooks/use-areas';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';

interface DeleteAreaDialogProps {
  area: AreaDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteAreaDialog({
  area,
  isOpen,
  onClose,
  onSuccess,
}: DeleteAreaDialogProps) {
  const { deleteArea } = useAreas();
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap defaults to safe Cancel button to prevent accidental confirmation
  useFocusTrap(isOpen, dialogRef, cancelButtonRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false);
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

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);

      await deleteArea(area.id);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete area';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-area-title"
      aria-describedby="delete-area-desc"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl z-10 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delete-area-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Delete Area
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
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

        <div className="text-xs text-muted-foreground space-y-2 py-1 leading-relaxed">
          <p id="delete-area-desc">
            Are you sure you want to delete <strong className="text-foreground font-semibold">{area.name}</strong>?
          </p>
          <p>
            All projects, structures, and configurations scoped to this area will be permanently removed.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[36px] text-xs font-medium rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Area</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
