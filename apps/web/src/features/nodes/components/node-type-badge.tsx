'use client';

import React from 'react';
import {
  Sparkles,
  Boxes,
  Cpu,
  Code,
  Database,
  Compass,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { NodeType, NODE_TYPES } from '@devspace/contracts';

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  textClass: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  concept: {
    label: 'Concept',
    icon: Sparkles,
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    textClass: 'text-indigo-400',
  },
  component: {
    label: 'Component',
    icon: Boxes,
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    textClass: 'text-cyan-400',
  },
  service: {
    label: 'Service',
    icon: Cpu,
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    textClass: 'text-sky-400',
  },
  module: {
    label: 'Module',
    icon: Code,
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    textClass: 'text-purple-400',
  },
  database: {
    label: 'Database',
    icon: Database,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    textClass: 'text-emerald-400',
  },
  interface: {
    label: 'Interface',
    icon: Compass,
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    textClass: 'text-amber-400',
  },
  custom: {
    label: 'Custom',
    icon: Tag,
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    textClass: 'text-slate-400',
  },
};

interface NodeTypeBadgeProps {
  type: NodeType;
  className?: string;
  showIcon?: boolean;
}

export function NodeTypeBadge({
  type,
  className = '',
  showIcon = true,
}: NodeTypeBadgeProps) {
  const config = NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.concept;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${config.badgeClass} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}

