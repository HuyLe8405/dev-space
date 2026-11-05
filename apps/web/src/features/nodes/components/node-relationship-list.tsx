'use client';

import React, { useState } from 'react';
import { GitFork, Plus, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import type { NodeRelationshipDto, ProjectDto } from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { NodeTypeBadge } from './node-type-badge';
import {
  CreateRelationshipDialog,
  RELATION_TYPE_CONFIG,
} from './create-relationship-dialog';

interface NodeRelationshipListProps {
  project: ProjectDto;
}

export function NodeRelationshipList({ project }: NodeRelationshipListProps) {
  const { nodes, relationships, deleteRelationship } = useNodes();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const nodeMap = React.useMemo(() => {
    return new Map(nodes.map((n) => [n.id, n]));
  }, [nodes]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteRelationship(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (relationships.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 p-12 text-center flex flex-col items-center justify-center min-h-[260px] animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground/70 mb-3 shadow-sm">
          <GitFork className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
          No Node Connections
        </h3>

        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-5">
          {nodes.length < 2
            ? 'Add at least two nodes to this project to create relationships between them.'
            : 'Link architectural components together with dependencies, containment, or semantic associations.'}
        </p>

        {nodes.length >= 2 && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Connect two nodes with a new relationship"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[32px] text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Connect Nodes</span>
          </button>
        )}

        <CreateRelationshipDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Header bar with Connect Nodes button */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Connections
          </h4>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
            {relationships.length}
          </span>
        </div>

        {nodes.length >= 2 && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Connect two nodes with a new relationship"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            <span>Connect Nodes</span>
          </button>
        )}
      </div>

      {/* List of Relationships */}
      <div className="space-y-2">
        {relationships.map((rel) => {
          const source = nodeMap.get(rel.sourceNodeId);
          const target = nodeMap.get(rel.targetNodeId);
          const relConfig =
            RELATION_TYPE_CONFIG[rel.type] || RELATION_TYPE_CONFIG.relates_to;
          const isDeleting = deletingId === rel.id;

          return (
            <div
              key={rel.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors gap-3"
            >
              {/* Flow: Source -> Relation Badge -> Target */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Source Node */}
                <div className="flex items-center gap-2 min-w-0 max-w-[160px] sm:max-w-[200px]">
                  {source ? (
                    <>
                      <NodeTypeBadge type={source.nodeType} showIcon={false} />
                      <span
                        title={source.name}
                        className="text-xs font-medium text-foreground truncate"
                      >
                        {source.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Unknown Node
                    </span>
                  )}
                </div>

                {/* Directed Connector Line */}
                <div className="flex flex-col items-center px-1 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border/80 bg-muted/60">
                    <span className={relConfig.badgeClass.split(' ')[1]}>
                      {relConfig.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/70" />
                  </div>
                  {rel.label && (
                    <span
                      title={rel.label}
                      className="text-[10px] text-muted-foreground italic mt-0.5 truncate max-w-[120px]"
                    >
                      {rel.label}
                    </span>
                  )}
                </div>

                {/* Target Node */}
                <div className="flex items-center gap-2 min-w-0 max-w-[160px] sm:max-w-[200px]">
                  {target ? (
                    <>
                      <NodeTypeBadge type={target.nodeType} showIcon={false} />
                      <span
                        title={target.name}
                        className="text-xs font-medium text-foreground truncate"
                      >
                        {target.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Unknown Node
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => handleDelete(rel.id)}
                disabled={isDeleting}
                title={`Remove ${relConfig.label} connection from ${source?.name ?? 'source node'} to ${target?.name ?? 'target node'}`}
                aria-label={
                  isDeleting
                    ? `Removing ${relConfig.label} connection from ${source?.name ?? 'source node'} to ${target?.name ?? 'target node'}...`
                    : `Remove ${relConfig.label} connection from ${source?.name ?? 'source node'} to ${target?.name ?? 'target node'}`
                }
                className="relative self-end sm:self-center p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 after:absolute after:-inset-2 after:content-[''] sm:after:hidden"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Removing connection...</span>
                  </>
                ) : (
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <CreateRelationshipDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

