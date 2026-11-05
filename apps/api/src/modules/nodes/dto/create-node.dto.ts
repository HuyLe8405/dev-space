import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateNodeRequest, NODE_TYPES, NodeType } from '@devspace/contracts';

export class CreateNodeDto implements CreateNodeRequest {
  @IsString()
  @IsNotEmpty({ message: 'Node name is required' })
  @MinLength(1, { message: 'Node name is required' })
  @MaxLength(50, { message: 'Node name must not exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Description must not exceed 280 characters' })
  description?: string;

  @IsOptional()
  @IsIn(NODE_TYPES, { message: 'Invalid node type' })
  nodeType?: NodeType;
}

