import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { ReorderAreasRequest } from '@devspace/contracts';

export class ReorderAreasDto implements ReorderAreasRequest {
  @IsArray()
  @ArrayNotEmpty({ message: 'areaIds must not be empty' })
  @IsString({ each: true, message: 'Each areaId must be a string' })
  areaIds!: string[];
}

