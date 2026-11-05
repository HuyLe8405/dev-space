'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { NodeDto } from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';

interface DeleteNodeDialogProps {
  node: NodeDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteNodeDialog({
  node,
  isOpen,
  onClose,
  onSuccess,
}: DeleteNodeDialogProps) {
  const { deleteNode, getConnectionCount } = useNodes();
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const connectionCount = getConnectionCount(node.id);

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);

      await deleteNode(node.id);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete node';
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
      aria-labelledby="delete-node-title"
      aria-describedby="delete-node-desc"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10 space-y-4 my-auto animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delete-node-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Delete Node
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
            className="relative rounded-lg p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {error}
          </div>
        )}

        <div id="delete-node-desc" className="space-y-3 text-xs text-muted-foreground">
          <p>
            Are you sure you want to delete <strong className="text-foreground">&ldquo;{node.name}&rdquo;</strong>?
          </p>

          {connectionCount > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <span className="font-semibold">Notice: </span>
              This node has <strong>{connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}</strong>.
              Deleting this node will automatically remove all attached relationships.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Node</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
