export const RELATION_TYPES = [
  'relates_to',
  'depends_on',
  'contains',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

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

