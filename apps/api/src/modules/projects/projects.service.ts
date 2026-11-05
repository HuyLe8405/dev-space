import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
  ProjectDto,
  ProjectListResponse,
  WorkspaceColor,
  WorkspaceIcon,
} from '@devspace/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(
    project: {
      id: string;
      areaId: string;
      name: string;
      description: string | null;
      icon: string;
      color: string;
      createdAt: Date | string;
      updatedAt: Date | string;
    },
    nodeCount = 0,
  ): ProjectDto {
    const createdAtStr =
      project.createdAt instanceof Date
        ? project.createdAt.toISOString()
        : new Date(project.createdAt).toISOString();

    const updatedAtStr =
      project.updatedAt instanceof Date
        ? project.updatedAt.toISOString()
        : new Date(project.updatedAt).toISOString();

    return {
      id: project.id,
      areaId: project.areaId,
      name: project.name,
      description: project.description,
      icon: project.icon as WorkspaceIcon,
      color: project.color as WorkspaceColor,
      nodeCount,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  }

  async verifyAreaOwnership(userId: string, workspaceId: string, areaId: string) {
    const area = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        workspaceId,
        workspace: {
          userId,
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return area;
  }

  async create(
    userId: string,
    workspaceId: string,
    areaId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectDto> {
    await this.verifyAreaOwnership(userId, workspaceId, areaId);

    const trimmedName = dto.name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Project name cannot be empty');
    }

    // Case-insensitive duplicate name check within area
    const existing = await this.prisma.project.findFirst({
      where: {
        areaId,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A project with the name "${trimmedName}" already exists in this area`,
      );
    }

    const project = await this.prisma.project.create({
      data: {
        areaId,
        name: trimmedName,
        description: dto.description?.trim() || null,
        icon: dto.icon || DEFAULT_PROJECT_ICON,
        color: dto.color || DEFAULT_PROJECT_COLOR,
      },
    });

    return this.toDto(project, 0);
  }

  async findAllForArea(
    userId: string,
    workspaceId: string,
    areaId: string,
  ): Promise<ProjectListResponse> {
    await this.verifyAreaOwnership(userId, workspaceId, areaId);

    const projects = await this.prisma.project.findMany({
      where: { areaId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    const items = projects.map((p) => this.toDto(p, p._count.nodes));

    return {
      items,
      total: items.length,
    };
  }

  async findOne(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
  ): Promise<ProjectDto> {
    await this.verifyAreaOwnership(userId, workspaceId, areaId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        areaId,
      },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toDto(project, project._count.nodes);
  }

  async update(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    await this.verifyAreaOwnership(userId, workspaceId, areaId);

    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        areaId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    let updateName: string | undefined = undefined;
    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Project name cannot be empty');
      }

      // Check case-insensitive duplicate if name is changing
      if (trimmedName.toLowerCase() !== existingProject.name.toLowerCase()) {
        const duplicate = await this.prisma.project.findFirst({
          where: {
            areaId,
            name: {
              equals: trimmedName,
              mode: 'insensitive',
            },
            NOT: {
              id: projectId,
            },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            `A project with the name "${trimmedName}" already exists in this area`,
          );
        }
      }

      updateName = trimmedName;
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(updateName !== undefined && { name: updateName }),
        ...(dto.description !== undefined && {
          description: dto.description ? dto.description.trim() : null,
        }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    return this.toDto(updated, updated._count.nodes);
  }

  async remove(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
  ): Promise<void> {
    await this.verifyAreaOwnership(userId, workspaceId, areaId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        areaId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}

