'use client';

import React from 'react';
import { Boxes, Plus } from 'lucide-react';

interface ProjectEmptyNodesStateProps {
  projectName?: string;
  onAddNode: () => void;
}

export function ProjectEmptyNodesState({
  projectName,
  onAddNode,
}: ProjectEmptyNodesStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 p-12 text-center flex flex-col items-center justify-center min-h-[300px] animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-sm">
        <Boxes className="w-7 h-7" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
        No Nodes in {projectName || 'this Project'}
      </h3>

      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-6">
        Nodes represent the conceptual building blocks of your project: services, modules, databases, components, and concepts.
      </p>

      <button
        type="button"
        onClick={onAddNode}
        className="inline-flex items-center gap-2 px-4 py-2 min-h-[36px] text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add First Node</span>
      </button>
    </div>
  );
}

