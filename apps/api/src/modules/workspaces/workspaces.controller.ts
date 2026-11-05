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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import type { WorkspaceDto, WorkspaceListResponse } from '@devspace/contracts';

@ApiTags('workspaces')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<WorkspaceListResponse> {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<WorkspaceDto> {
    return this.workspacesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    return this.workspacesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.workspacesService.remove(user.id, id);
  }
}

