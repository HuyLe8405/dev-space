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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectDto, ProjectListResponse } from '@devspace/contracts';

@ApiTags('projects')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/areas/:areaId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project in an area' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or empty name' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  @ApiResponse({ status: 409, description: 'Project name already exists in area' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectsService.create(user.id, workspaceId, areaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for an area' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
  ): Promise<ProjectListResponse> {
    return this.projectsService.findAllForArea(user.id, workspaceId, areaId);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a specific project by id within an area' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
  ): Promise<ProjectDto> {
    return this.projectsService.findOne(user.id, workspaceId, areaId, projectId);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update an existing project within an area' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Project name already exists in area' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectsService.update(
      user.id,
      workspaceId,
      areaId,
      projectId,
      dto,
    );
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project within an area' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    return this.projectsService.remove(user.id, workspaceId, areaId, projectId);
  }
}

