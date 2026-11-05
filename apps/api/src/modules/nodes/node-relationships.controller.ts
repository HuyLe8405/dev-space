import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { NodeRelationshipsService } from './node-relationships.service';
import { CreateNodeRelationshipDto } from './dto/create-node-relationship.dto';
import { UpdateNodeRelationshipDto } from './dto/update-node-relationship.dto';
import type {
  NodeRelationshipDto,
  NodeRelationshipListResponse,
} from '@devspace/contracts';

@ApiTags('node-relationships')
@UseGuards(JwtAuthGuard)
@Controller(
  'workspaces/:workspaceId/areas/:areaId/projects/:projectId/relationships',
)
export class NodeRelationshipsController {
  constructor(
    private readonly relationshipsService: NodeRelationshipsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a directed relationship between two nodes' })
  @ApiResponse({ status: 201, description: 'Relationship created successfully' })
  @ApiResponse({ status: 400, description: 'Self-referencing relationship not allowed' })
  @ApiResponse({ status: 404, description: 'Project or Node not found' })
  @ApiResponse({ status: 409, description: 'Relationship already exists' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateNodeRelationshipDto,
  ): Promise<NodeRelationshipDto> {
    return this.relationshipsService.create(
      user.id,
      workspaceId,
      areaId,
      projectId,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all relationships for a project' })
  @ApiResponse({ status: 200, description: 'List of relationships' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
  ): Promise<NodeRelationshipListResponse> {
    return this.relationshipsService.findAllForProject(
      user.id,
      workspaceId,
      areaId,
      projectId,
    );
  }

  @Patch(':relationshipId')
  @ApiOperation({ summary: 'Update an existing relationship within a project' })
  @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  @ApiResponse({ status: 409, description: 'Conflict on duplicate relation type' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() dto: UpdateNodeRelationshipDto,
  ): Promise<NodeRelationshipDto> {
    return this.relationshipsService.update(
      user.id,
      workspaceId,
      areaId,
      projectId,
      relationshipId,
      dto,
    );
  }

  @Delete(':relationshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relationship within a project' })
  @ApiResponse({ status: 204, description: 'Relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
  ): Promise<void> {
    return this.relationshipsService.remove(
      user.id,
      workspaceId,
      areaId,
      projectId,
      relationshipId,
    );
  }
}

