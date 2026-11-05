'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, ArrowRight } from 'lucide-react';
import {
  DEFAULT_RELATION_TYPE,
  RELATION_TYPES,
  RelationType,
} from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { useFocusTrap } from '@/features/workspaces/hooks/use-focus-trap';
import { NodeTypeBadge } from './node-type-badge';

interface CreateRelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceId?: string;
  defaultTargetId?: string;
  onSuccess?: () => void;
}

export const RELATION_TYPE_CONFIG: Record<
  RelationType,
  { label: string; badgeClass: string }
> = {
  relates_to: {
    label: 'relates to',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  depends_on: {
    label: 'depends on',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  contains: {
    label: 'contains',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};

export function CreateRelationshipDialog({
  isOpen,
  onClose,
  defaultSourceId,
  defaultTargetId,
  onSuccess,
}: CreateRelationshipDialogProps) {
  const { nodes, relationships, createRelationship } = useNodes();

  const [mounted, setMounted] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState(defaultSourceId || '');
  const [targetNodeId, setTargetNodeId] = useState(defaultTargetId || '');
  const [type, setType] = useState<RelationType>(DEFAULT_RELATION_TYPE);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectRef = useRef<HTMLSelectElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(isOpen, dialogRef, selectRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initialSource = defaultSourceId || (nodes.length > 0 ? nodes[0].id : '');
      const initialTarget =
        defaultTargetId ||
        (nodes.length > 1 ? (nodes[0].id === initialSource ? nodes[1].id : nodes[0].id) : '');
      setSourceNodeId(initialSource);
      setTargetNodeId(initialTarget);
      setType(DEFAULT_RELATION_TYPE);
      setLabel('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultSourceId, defaultTargetId, nodes]);

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

  const isSelfReferencing = sourceNodeId === targetNodeId;
  const isDuplicate = relationships.some(
    (r) =>
      r.sourceNodeId === sourceNodeId &&
      r.targetNodeId === targetNodeId &&
      r.type === type,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceNodeId || !targetNodeId) {
      setError('Both source and target nodes are required');
      return;
    }

    if (isSelfReferencing) {
      setError('A node cannot connect to itself');
      return;
    }

    if (isDuplicate) {
      setError('A connection with this type already exists between these nodes');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createRelationship({
        sourceNodeId,
        targetNodeId,
        type,
        label: label.trim() || undefined,
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create connection';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      aria-labelledby="create-rel-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 id="create-rel-title" className="text-base font-semibold text-foreground">
              Connect Nodes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create a directed relationship between two nodes
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
          {/* Source Node Selector */}
          <div className="space-y-1.5">
            <label htmlFor="source-node-select" className="text-xs font-medium text-foreground">
              Source Node *
            </label>
            <select
              ref={selectRef}
              id="source-node-select"
              required
              value={sourceNodeId}
              onChange={(e) => {
                setSourceNodeId(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.nodeType})
                </option>
              ))}
            </select>
          </div>

          {/* Relationship Type Selector */}
          <div className="space-y-1.5">
            <label htmlFor="rel-type-select" className="text-xs font-medium text-foreground">
              Relationship Type *
            </label>
            <select
              id="rel-type-select"
              required
              value={type}
              onChange={(e) => {
                setType(e.target.value as RelationType);
                if (error) setError(null);
              }}
              className="w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {RELATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RELATION_TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Node Selector (Disables or hides source node to prevent self-reference) */}
          <div className="space-y-1.5">
            <label htmlFor="target-node-select" className="text-xs font-medium text-foreground">
              Target Node *
            </label>
            <select
              id="target-node-select"
              required
              value={targetNodeId}
              onChange={(e) => {
                setTargetNodeId(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {nodes
                .filter((node) => node.id !== sourceNodeId)
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.nodeType})
                  </option>
                ))}
            </select>
            {isSelfReferencing && (
              <p className="text-[11px] text-rose-400">
                A node cannot connect to itself
              </p>
            )}
            {isDuplicate && (
              <p className="text-[11px] text-rose-400">
                This directed connection already exists
              </p>
            )}
          </div>

          {/* Optional Label */}
          <div className="space-y-1.5">
            <label
              htmlFor="rel-label-input"
              className="text-xs font-medium text-foreground flex justify-between"
            >
              <span>Label (Optional)</span>
              <span className="text-[11px] text-muted-foreground">
                {label.length}/100
              </span>
            </label>
            <input
              id="rel-label-input"
              type="text"
              maxLength={100}
              placeholder="e.g. queries for user sessions"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Flow Preview */}
          {sourceNode && targetNode && !isSelfReferencing && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs flex items-center justify-between gap-2">
              <span className="font-medium text-foreground truncate max-w-[120px]">
                {sourceNode.name}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-full border border-border/80 bg-muted/60 text-muted-foreground shrink-0">
                <span>{RELATION_TYPE_CONFIG[type].label}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <span className="font-medium text-foreground truncate max-w-[120px]">
                {targetNode.name}
              </span>
            </div>
          )}

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
              disabled={
                isSubmitting ||
                !sourceNodeId ||
                !targetNodeId ||
                isSelfReferencing ||
                isDuplicate
              }
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Create Connection</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

