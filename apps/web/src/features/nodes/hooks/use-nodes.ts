'use client';

import { useContext } from 'react';
import { NodeContext, type NodeContextValue } from '../context/node-context';

export function useNodes(): NodeContextValue {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodes must be used within a NodeProvider');
  }
  return context;
}

