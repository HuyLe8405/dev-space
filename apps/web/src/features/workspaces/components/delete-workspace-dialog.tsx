'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { WorkspaceDto } from '@devspace/contracts';
import { useWorkspaces } from '../hooks/use-workspaces';
import { useFocusTrap } from '../hooks/use-focus-trap';

interface DeleteWorkspaceDialogProps {
  workspace: WorkspaceDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteWorkspaceDialog({
  workspace,
  isOpen,
  onClose,
  onSuccess,
}: DeleteWorkspaceDialogProps) {
  const { deleteWorkspace } = useWorkspaces();
  const [mounted, setMounted] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(isOpen, dialogRef, inputRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfirmName('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen, workspace]);

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

  const isConfirmed = confirmName.trim() === workspace.name;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteWorkspace(workspace.id);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(msg);
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-workspace-title"
      aria-describedby="delete-workspace-desc"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-destructive/40 bg-card p-5 sm:p-6 shadow-2xl z-10 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delete-workspace-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Delete Workspace
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action cannot be undone.
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

        <div
          id="delete-workspace-desc"
          className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300 leading-relaxed"
        >
          Are you sure you want to delete <span className="font-semibold text-foreground">{workspace.name}</span>? This action is permanent and will cascade-delete all future areas, projects, and notes contained inside.
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

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-workspace-name"
              className="block text-xs text-muted-foreground"
            >
              Type the workspace name <span className="font-semibold text-foreground">{workspace.name}</span> to confirm:
            </label>
            <input
              ref={inputRef}
              id="confirm-workspace-name"
              type="text"
              autoComplete="off"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={workspace.name}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
