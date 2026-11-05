export const NODE_TYPES = [
  'concept',
  'component',
  'service',
  'module',
  'database',
  'interface',
  'custom',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const DEFAULT_NODE_TYPE: NodeType = 'concept';

export interface NodeDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  nodeType: NodeType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNodeRequest {
  name: string;
  description?: string;
  nodeType?: NodeType;
}

export interface UpdateNodeRequest {
  name?: string;
  description?: string | null;
  nodeType?: NodeType;
}

export interface NodeListResponse {
  items: NodeDto[];
  total: number;
}

