'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import {
  NODE_TYPES,
  NodeType,
  NodeDto,
} from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';
import { NodeTypeBadge, NODE_TYPE_CONFIG } from './node-type-badge';

interface EditNodeDialogProps {
  node: NodeDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: NodeDto) => void;
}

export function EditNodeDialog({
  node,
  isOpen,
  onClose,
  onSuccess,
}: EditNodeDialogProps) {
  const { nodes, updateNode } = useNodes();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(node.name);
  const [description, setDescription] = useState(node.description || '');
  const [nodeType, setNodeType] = useState<NodeType>(node.nodeType);
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
      setName(node.name);
      setDescription(node.description || '');
      setNodeType(node.nodeType);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, node]);

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
      nodes.some(
        (n) =>
          n.id !== node.id &&
          n.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      ),
  );

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) {
      setError('Node name is required');
      return;
    }

    if (isDuplicateName) {
      setError(`A node with the name "${trimmedName}" already exists in this project`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updated = await updateNode(node.id, {
        name: trimmedName,
        description: description.trim() || null,
        nodeType,
      });

      onClose();
      if (onSuccess) {
        onSuccess(updated);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update node';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      aria-labelledby="edit-node-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 id="edit-node-title" className="text-base font-semibold text-foreground">
              Edit Node
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update node details and classification
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
              htmlFor="edit-node-name-input"
              className="text-xs font-medium text-foreground flex justify-between"
            >
              <span>Node Name *</span>
              <span className="text-[11px] text-muted-foreground">
                {name.length}/50
              </span>
            </label>
            <input
              ref={inputRef}
              id="edit-node-name-input"
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Auth Module"
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
                A node with this name already exists in this project
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-node-type-select" className="text-xs font-medium text-foreground">
                Node Type
              </label>
              <NodeTypeBadge type={nodeType} />
            </div>
            <select
              id="edit-node-type-select"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as NodeType)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {NODE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {NODE_TYPE_CONFIG[type].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-node-description-input"
              className="text-xs font-medium text-foreground flex justify-between"
            >
              <span>Description (Optional)</span>
              <span className="text-[11px] text-muted-foreground">
                {description.length}/280
              </span>
            </label>
            <textarea
              id="edit-node-description-input"
              rows={2}
              maxLength={280}
              placeholder="What role does this node play?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
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

