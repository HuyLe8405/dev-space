import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NODE_TYPES, NodeType, UpdateNodeRequest } from '@devspace/contracts';

export class UpdateNodeDto implements UpdateNodeRequest {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Node name cannot be empty' })
  @MaxLength(50, { message: 'Node name must not exceed 50 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string | null;

  @IsOptional()
  @IsIn(NODE_TYPES, { message: 'Invalid node type' })
  nodeType?: NodeType;
}

