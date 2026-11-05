import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CreateNodeRelationshipRequest,
  RELATION_TYPES,
  RelationType,
} from '@devspace/contracts';

export class CreateNodeRelationshipDto implements CreateNodeRelationshipRequest {
  @IsString()
  @IsNotEmpty({ message: 'Source node id is required' })
  sourceNodeId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Target node id is required' })
  targetNodeId!: string;

  @IsOptional()
  @IsIn(RELATION_TYPES, { message: 'Invalid relation type' })
  type?: RelationType;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Label must not exceed 100 characters' })
  label?: string;
}

