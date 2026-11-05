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
import { NodesService } from './nodes.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import type { NodeDto, NodeListResponse } from '@devspace/contracts';

@ApiTags('nodes')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/areas/:areaId/projects/:projectId/nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conceptual node in a project' })
  @ApiResponse({ status: 201, description: 'Node created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or empty name' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Node name already exists in project' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateNodeDto,
  ): Promise<NodeDto> {
    return this.nodesService.create(user.id, workspaceId, areaId, projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all nodes for a project' })
  @ApiResponse({ status: 200, description: 'List of nodes' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
  ): Promise<NodeListResponse> {
    return this.nodesService.findAllForProject(
      user.id,
      workspaceId,
      areaId,
      projectId,
    );
  }

  @Get(':nodeId')
  @ApiOperation({ summary: 'Get a specific node by id within a project' })
  @ApiResponse({ status: 200, description: 'Node details' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<NodeDto> {
    return this.nodesService.findOne(
      user.id,
      workspaceId,
      areaId,
      projectId,
      nodeId,
    );
  }

  @Patch(':nodeId')
  @ApiOperation({ summary: 'Update an existing node within a project' })
  @ApiResponse({ status: 200, description: 'Node updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  @ApiResponse({ status: 409, description: 'Node name already exists in project' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateNodeDto,
  ): Promise<NodeDto> {
    return this.nodesService.update(
      user.id,
      workspaceId,
      areaId,
      projectId,
      nodeId,
      dto,
    );
  }

  @Delete(':nodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a node within a project' })
  @ApiResponse({ status: 204, description: 'Node deleted successfully' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<void> {
    return this.nodesService.remove(
      user.id,
      workspaceId,
      areaId,
      projectId,
      nodeId,
    );
  }
}

