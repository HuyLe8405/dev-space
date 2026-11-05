'use client';

import React, { useState } from 'react';
import { Boxes, Plus, Compass, Layers, Sparkles } from 'lucide-react';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

export function OnboardingEmptyState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-sm">
          <Boxes className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome to DevSpace
        </h1>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
          You don&apos;t have any workspaces yet. Create your first workspace to start
          organizing your knowledge, domains, and projects.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Workspace</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-border/60 text-left w-full">
          <div className="p-3.5 rounded-lg border border-border/60 bg-card/40">
            <div className="flex items-center gap-2 text-sky-400 mb-1.5">
              <Compass className="w-4 h-4" />
              <h3 className="text-xs font-semibold">1. Life Domains</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Separate your focus: work, engineering, study, or personal growth.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border/60 bg-card/40">
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <Layers className="w-4 h-4" />
              <h3 className="text-xs font-semibold">2. Areas & Projects</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Group related goals and track progress inside focused containers.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border/60 bg-card/40">
            <div className="flex items-center gap-2 text-purple-400 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-semibold">3. 3D Canvas</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Explore your spatial knowledge islands and visualize milestones.
            </p>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
