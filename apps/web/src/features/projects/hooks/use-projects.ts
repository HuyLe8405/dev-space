'use client';

import { useContext } from 'react';
import { ProjectContext, type ProjectContextValue } from '../context/project-context';

export function useProjects(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

