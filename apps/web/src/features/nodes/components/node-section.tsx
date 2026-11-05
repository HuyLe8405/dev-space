'use client';

import React, { useState } from 'react';
import { Boxes, GitFork, AlertCircle, RefreshCw } from 'lucide-react';
import type { ProjectDto } from '@devspace/contracts';
import { NodeProvider } from '../context/node-context';
import { useNodes } from '../hooks/use-nodes';
import { NodeList } from './node-list';
import { NodeRelationshipList } from './node-relationship-list';

interface NodeSectionProps {
  project: ProjectDto;
  workspaceId: string;
  areaId: string;
}

function NodeSectionContent({ project }: { project: ProjectDto }) {
  const { nodes, relationships, isLoading, error, refreshNodes } = useNodes();
  const [activeTab, setActiveTab] = useState<'nodes' | 'relationships'>('nodes');

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveTab('relationships');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveTab('nodes');
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab('nodes');
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab('relationships');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading nodes">
        <div className="h-9 w-48 bg-muted/40 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-border/60 bg-card/40 p-4"
            />
          ))}
        </div>
        <span className="sr-only">Loading nodes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center flex flex-col items-center justify-center space-y-2.5"
      >
        <AlertCircle className="w-5 h-5 text-rose-400" />
        <h4 className="text-xs font-semibold text-foreground">Failed to load nodes</h4>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={refreshNodes}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Switcher: Nodes vs Connections */}
      <div className="flex items-center justify-between pb-1">
        <div
          role="tablist"
          aria-label="Project view options"
          className="inline-flex items-center p-1 rounded-xl bg-muted/30 border border-border/60 text-xs"
        >
          <button
            id={`project-tab-nodes-${project.id}`}
            role="tab"
            type="button"
            aria-selected={activeTab === 'nodes'}
            aria-controls={`project-panel-nodes-${project.id}`}
            tabIndex={activeTab === 'nodes' ? 0 : -1}
            onClick={() => setActiveTab('nodes')}
            onKeyDown={handleTabKeyDown}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              activeTab === 'nodes'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nodes ({nodes.length})</span>
          </button>
          <button
            id={`project-tab-relationships-${project.id}`}
            role="tab"
            type="button"
            aria-selected={activeTab === 'relationships'}
            aria-controls={`project-panel-relationships-${project.id}`}
            tabIndex={activeTab === 'relationships' ? 0 : -1}
            onClick={() => setActiveTab('relationships')}
            onKeyDown={handleTabKeyDown}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              activeTab === 'relationships'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Connections ({relationships.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div
        id={`project-panel-${activeTab}-${project.id}`}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`project-tab-${activeTab}-${project.id}`}
        className="focus:outline-none"
      >
        {activeTab === 'nodes' ? (
          <NodeList project={project} />
        ) : (
          <NodeRelationshipList project={project} />
        )}
      </div>
    </div>
  );
}

export function NodeSection({ project, workspaceId, areaId }: NodeSectionProps) {
  return (
    <NodeProvider
      workspaceId={workspaceId}
      areaId={areaId}
      projectId={project.id}
    >
      <NodeSectionContent project={project} />
    </NodeProvider>
  );
}
