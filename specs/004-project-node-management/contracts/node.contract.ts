export const NODE_TYPES = [
  'concept',
  'component',
  'service',
  'module',
  'database',
  'interface',
  'custom',
] as const;

export type NodeType = typeof NODE_TYPES[number];

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

export const RELATION_TYPES = [
  'relates_to',
  'depends_on',
  'contains',
] as const;

export type RelationType = typeof RELATION_TYPES[number];

export const DEFAULT_RELATION_TYPE: RelationType = 'relates_to';

export interface NodeRelationshipDto {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: RelationType;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNodeRelationshipRequest {
  sourceNodeId: string;
  targetNodeId: string;
  type?: RelationType;
  label?: string;
}

export interface UpdateNodeRelationshipRequest {
  type?: RelationType;
  label?: string | null;
}

export interface NodeRelationshipListResponse {
  items: NodeRelationshipDto[];
  total: number;
}

