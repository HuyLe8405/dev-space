'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { NODE_TYPES, NodeType, NodeDto, ProjectDto } from '@devspace/contracts';
import { useNodes } from '../hooks/use-nodes';
import { NodeCard } from './node-card';
import { ProjectEmptyNodesState } from './project-empty-nodes-state';
import { CreateNodeDialog } from './create-node-dialog';
import { EditNodeDialog } from './edit-node-dialog';
import { DeleteNodeDialog } from './delete-node-dialog';
import { NODE_TYPE_CONFIG } from './node-type-badge';

interface NodeListProps {
  project: ProjectDto;
}

export function NodeList({ project }: NodeListProps) {
  const { nodes } = useNodes();

  const [selectedType, setSelectedType] = useState<NodeType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeDto | null>(null);
  const [deletingNode, setDeletingNode] = useState<NodeDto | null>(null);

  const filteredNodes = useMemo(() => {
    let result = [...nodes];

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((n) => n.nodeType === selectedType);
    }

    // Filter by query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.description && n.description.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [nodes, selectedType, searchQuery]);

  if (nodes.length === 0) {
    return (
      <>
        <ProjectEmptyNodesState
          projectName={project.name}
          onAddNode={() => setIsCreateOpen(true)}
        />
        <CreateNodeDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Control Bar: Filter chips, search input & Add Node button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2 border-b border-border/50">
        {/* Horizontal filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            aria-pressed={selectedType === 'all'}
            aria-label={`Show all nodes (${nodes.length} total)`}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all shrink-0 cursor-pointer ${
              selectedType === 'all'
                ? 'bg-primary/10 text-primary border-primary/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
            }`}
          >
            All ({nodes.length})
          </button>

          {NODE_TYPES.map((type) => {
            const count = nodes.filter((n) => n.nodeType === type).length;
            const isSelected = selectedType === type;
            const config = NODE_TYPE_CONFIG[type];

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                aria-pressed={isSelected}
                aria-label={`Filter by ${config.label} (${count} ${count === 1 ? 'node' : 'nodes'})`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? `${config.badgeClass} shadow-xs font-semibold`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
                }`}
              >
                <span>{config.label}</span>
                {count > 0 && (
                  <span className="text-[10px] opacity-80">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2 sm:gap-3 self-end lg:self-auto w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              aria-label="Search nodes by name or description"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-48 h-8 pl-8 pr-7 text-xs rounded-lg bg-card/60 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Add new node to project"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>
        </div>
      </div>

      {/* Grid or Filter Empty State */}
      {filteredNodes.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2 bg-card/20"
        >
          <p className="text-xs text-muted-foreground">
            {searchQuery.trim()
              ? `No nodes matching "${searchQuery.trim()}".`
              : selectedType !== 'all'
              ? `No ${NODE_TYPE_CONFIG[selectedType].label.toLowerCase()} nodes found in this project.`
              : 'No nodes found for the selected criteria.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedType('all');
              setSearchQuery('');
            }}
            aria-label="Reset active search query and node type filters"
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onEdit={() => setEditingNode(node)}
              onDelete={() => setDeletingNode(node)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateNodeDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editingNode && (
        <EditNodeDialog
          node={editingNode}
          isOpen={true}
          onClose={() => setEditingNode(null)}
        />
      )}

      {deletingNode && (
        <DeleteNodeDialog
          node={deletingNode}
          isOpen={true}
          onClose={() => setDeletingNode(null)}
        />
      )}
    </div>
  );
}

