'use client';

import React from 'react';
import type { AreaDto } from '@devspace/contracts';
import { ProjectProvider } from '../context/project-context';
import { useProjects } from '../hooks/use-projects';
import { ProjectList } from './project-list';
import { ProjectCanvas } from './project-canvas';
import { ProjectLoadingSkeleton } from './project-loading-skeleton';
import { ProjectErrorState } from './project-error-state';

interface ProjectSectionProps {
  area: AreaDto;
  nodeSectionContent?: React.ReactNode;
}

function ProjectSectionContent({
  area,
  nodeSectionContent,
}: ProjectSectionProps) {
  const { activeProject, isLoading, error, refreshProjects } = useProjects();

  if (isLoading) {
    return <ProjectLoadingSkeleton />;
  }

  if (error) {
    return <ProjectErrorState error={error} onRetry={refreshProjects} />;
  }

  if (activeProject) {
    return (
      <ProjectCanvas project={activeProject} area={area}>
        {nodeSectionContent}
      </ProjectCanvas>
    );
  }

  return <ProjectList area={area} />;
}

export function ProjectSection({
  area,
  nodeSectionContent,
}: ProjectSectionProps) {
  return (
    <ProjectProvider workspaceId={area.workspaceId} areaId={area.id}>
      <ProjectSectionContent
        area={area}
        nodeSectionContent={nodeSectionContent}
      />
    </ProjectProvider>
  );
}
