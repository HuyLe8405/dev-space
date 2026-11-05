import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_AREA_COLOR,
  DEFAULT_AREA_ICON,
  AreaDto,
  AreaListResponse,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ReorderAreasDto } from './dto/reorder-areas.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(area: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    order: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): AreaDto {
    const createdAtStr =
      area.createdAt instanceof Date
        ? area.createdAt.toISOString()
        : new Date(area.createdAt).toISOString();

    const updatedAtStr =
      area.updatedAt instanceof Date
        ? area.updatedAt.toISOString()
        : new Date(area.updatedAt).toISOString();

    return {
      id: area.id,
      workspaceId: area.workspaceId,
      name: area.name,
      description: area.description,
      icon: area.icon as WorkspaceIcon,
      color: area.color as WorkspaceColor,
      order: area.order,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  }

  private async verifyWorkspaceOwnership(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateAreaDto,
  ): Promise<AreaDto> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const trimmedName = dto.name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Area name cannot be empty');
    }

    // Case-insensitive duplicate name check within workspace
    const existing = await this.prisma.area.findFirst({
      where: {
        workspaceId,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `An area with the name "${trimmedName}" already exists in this workspace`,
      );
    }

    // Calculate sequential order: max(order) + 1, or 0 if first
    const maxOrderArea = await this.prisma.area.findFirst({
      where: { workspaceId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder =
      maxOrderArea !== null && maxOrderArea !== undefined ? maxOrderArea.order + 1 : 0;

    const area = await this.prisma.area.create({
      data: {
        workspaceId,
        name: trimmedName,
        description: dto.description?.trim() || null,
        icon: dto.icon || DEFAULT_AREA_ICON,
        color: dto.color || DEFAULT_AREA_COLOR,
        order: nextOrder,
      },
    });

    return this.toDto(area);
  }

  async findAllForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<AreaListResponse> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const areas = await this.prisma.area.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
    });

    return {
      items: areas.map((a) => this.toDto(a)),
      total: areas.length,
    };
  }

  async findOne(
    userId: string,
    workspaceId: string,
    areaId: string,
  ): Promise<AreaDto> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const area = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        workspaceId,
      },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return this.toDto(area);
  }

  async update(
    userId: string,
    workspaceId: string,
    areaId: string,
    dto: UpdateAreaDto,
  ): Promise<AreaDto> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const existingArea = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        workspaceId,
      },
    });

    if (!existingArea) {
      throw new NotFoundException('Area not found');
    }

    const data: {
      name?: string;
      description?: string | null;
      icon?: string;
      color?: string;
    } = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName || trimmedName.length === 0) {
        throw new BadRequestException('Area name cannot be empty');
      }

      // Check duplicate against sibling areas
      const siblingDuplicate = await this.prisma.area.findFirst({
        where: {
          workspaceId,
          id: { not: areaId },
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (siblingDuplicate) {
        throw new ConflictException(
          `An area with the name "${trimmedName}" already exists in this workspace`,
        );
      }

      data.name = trimmedName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.icon !== undefined) {
      data.icon = dto.icon;
    }

    if (dto.color !== undefined) {
      data.color = dto.color;
    }

    const updated = await this.prisma.area.update({
      where: { id: areaId },
      data,
    });

    return this.toDto(updated);
  }

  async remove(
    userId: string,
    workspaceId: string,
    areaId: string,
  ): Promise<void> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const existingArea = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        workspaceId,
      },
    });

    if (!existingArea) {
      throw new NotFoundException('Area not found');
    }

    await this.prisma.area.delete({
      where: { id: areaId },
    });
  }

  async reorder(
    userId: string,
    workspaceId: string,
    dto: ReorderAreasDto,
  ): Promise<AreaListResponse> {
    await this.verifyWorkspaceOwnership(userId, workspaceId);

    const existingAreas = await this.prisma.area.findMany({
      where: { workspaceId },
      select: { id: true },
    });

    const existingIdSet = new Set(existingAreas.map((a) => a.id));

    if (
      dto.areaIds.length !== existingAreas.length ||
      !dto.areaIds.every((id) => existingIdSet.has(id))
    ) {
      throw new BadRequestException('Invalid area reordering payload');
    }

    // Atomic batch update
    await this.prisma.$transaction(
      dto.areaIds.map((id, index) =>
        this.prisma.area.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.findAllForWorkspace(userId, workspaceId);
  }
}
