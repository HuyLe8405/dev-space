'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowUpDown, X } from 'lucide-react';
import type { AreaDto, ProjectDto } from '@devspace/contracts';
import { useProjects } from '../hooks/use-projects';
import { ProjectCard } from './project-card';
import { AreaEmptyProjectsState } from './area-empty-projects-state';
import { CreateProjectDialog } from './create-project-dialog';
import { EditProjectDialog } from './edit-project-dialog';
import { DeleteProjectDialog } from './delete-project-dialog';

interface ProjectListProps {
  area: AreaDto;
}

type SortOption = 'recent' | 'name-asc' | 'oldest';

export function ProjectList({ area }: ProjectListProps) {
  const { projects, setActiveProjectId } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectDto | null>(null);

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      // default: recent
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  if (projects.length === 0) {
    return (
      <>
        <AreaEmptyProjectsState
          areaName={area.name}
          onCreateProject={() => setIsCreateOpen(true)}
        />
        <CreateProjectDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Projects
          </h3>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
            {projects.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              aria-label="Search projects by name or description"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 md:w-56 h-8 pl-8 pr-7 text-xs rounded-lg bg-card/60 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-8 px-2 text-xs rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              aria-label="Sort projects"
            >
              <option value="recent">Recently Updated</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty Search Results */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2 bg-card/20">
          <p className="text-xs text-muted-foreground">
            No projects match <span className="text-foreground font-medium">&ldquo;{searchQuery}&rdquo;</span>
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => setActiveProjectId(project.id)}
              onEdit={() => setEditingProject(project)}
              onDelete={() => setDeletingProject(project)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          isOpen={true}
          onClose={() => setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          project={deletingProject}
          isOpen={true}
          onClose={() => setDeletingProject(null)}
        />
      )}
    </div>
  );
}
