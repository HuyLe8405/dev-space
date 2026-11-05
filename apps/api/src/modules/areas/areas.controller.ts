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
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ReorderAreasDto } from './dto/reorder-areas.dto';
import type { AreaDto, AreaListResponse } from '@devspace/contracts';

@ApiTags('areas')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new area in a workspace' })
  @ApiResponse({ status: 201, description: 'Area created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or empty name' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 409, description: 'Area name already exists in workspace' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateAreaDto,
  ): Promise<AreaDto> {
    return this.areasService.create(user.id, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all areas for a workspace ordered by sequence' })
  @ApiResponse({ status: 200, description: 'List of areas' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AreaListResponse> {
    return this.areasService.findAllForWorkspace(user.id, workspaceId);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Atomically reorder all areas in a workspace' })
  @ApiResponse({ status: 200, description: 'Updated list of areas in new order' })
  @ApiResponse({ status: 400, description: 'Invalid area reordering payload' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async reorder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ReorderAreasDto,
  ): Promise<AreaListResponse> {
    return this.areasService.reorder(user.id, workspaceId, dto);
  }

  @Get(':areaId')
  @ApiOperation({ summary: 'Get a specific area by id within workspace' })
  @ApiResponse({ status: 200, description: 'Area details' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
  ): Promise<AreaDto> {
    return this.areasService.findOne(user.id, workspaceId, areaId);
  }

  @Patch(':areaId')
  @ApiOperation({ summary: 'Update an existing area within workspace' })
  @ApiResponse({ status: 200, description: 'Area updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  @ApiResponse({ status: 409, description: 'Area name already exists in workspace' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaDto> {
    return this.areasService.update(user.id, workspaceId, areaId, dto);
  }

  @Delete(':areaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an area within workspace' })
  @ApiResponse({ status: 204, description: 'Area deleted successfully' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('areaId') areaId: string,
  ): Promise<void> {
    return this.areasService.remove(user.id, workspaceId, areaId);
  }
}
