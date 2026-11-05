import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  RELATION_TYPES,
  RelationType,
  UpdateNodeRelationshipRequest,
} from '@devspace/contracts';

export class UpdateNodeRelationshipDto implements UpdateNodeRelationshipRequest {
  @IsOptional()
  @IsIn(RELATION_TYPES, { message: 'Invalid relation type' })
  type?: RelationType;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Label must not exceed 100 characters' })
  label?: string | null;
}

