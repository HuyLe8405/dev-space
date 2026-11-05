'use client';

import React from 'react';
import { Pencil, Trash2, GitFork } from 'lucide-react';
import type { NodeDto } from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { NodeTypeBadge } from './node-type-badge';

interface NodeCardProps {
  node: NodeDto;
  onEdit: () => void;
  onDelete: () => void;
}

export function NodeCard({ node, onEdit, onDelete }: NodeCardProps) {
  const { getConnectionCount } = useNodes();
  const connectionCount = getConnectionCount(node.id);

  return (
    <div className="relative group rounded-xl border border-border/70 bg-card/50 hover:border-border hover:bg-card/80 p-3.5 transition-all flex flex-col justify-between min-h-[128px] shadow-sm hover:shadow-md text-left">
      {/* Header Row: Semantic Type Badge & Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <NodeTypeBadge type={node.nodeType} />

        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            title="Edit node"
            aria-label={`Edit ${node.name}`}
            className="relative p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete node"
            aria-label={`Delete ${node.name}`}
            className="relative p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body: Title & Description */}
      <div className="space-y-1 mb-2.5 flex-1 min-w-0">
        <h4
          title={node.name}
          className="text-sm font-semibold tracking-tight text-foreground truncate"
        >
          {node.name}
        </h4>
        <p
          title={node.description || ''}
          className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
        >
          {node.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Row: Connection indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        {connectionCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <GitFork className="w-3 h-3 text-primary" />
            <span>
              {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground italic">No connections</span>
        )}
      </div>
    </div>
  );
}

