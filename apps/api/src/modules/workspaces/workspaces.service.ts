import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_WORKSPACE_COLOR,
  DEFAULT_WORKSPACE_ICON,
  WorkspaceColor,
  WorkspaceDto,
  WorkspaceIcon,
  WorkspaceListResponse,
} from '@devspace/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const trimmedName = dto.name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Workspace name cannot be empty');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        userId,
        name: trimmedName,
        description: dto.description?.trim() || null,
        icon: dto.icon || DEFAULT_WORKSPACE_ICON,
        color: dto.color || DEFAULT_WORKSPACE_COLOR,
      },
    });

    return this.toDto(workspace);
  }

  async findAllForUser(userId: string): Promise<WorkspaceListResponse> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: workspaces.map((w) => this.toDto(w)),
      total: workspaces.length,
    };
  }

  async findOne(userId: string, id: string): Promise<WorkspaceDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, userId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.toDto(workspace);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    // Verifies existence and ownership atomically
    await this.findOne(userId, id);

    let trimmedName: string | undefined = undefined;
    if (dto.name !== undefined) {
      trimmedName = dto.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Workspace name cannot be empty');
      }
    }

    const updated = await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(trimmedName !== undefined && { name: trimmedName }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });

    return this.toDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    // Verifies existence and ownership atomically
    await this.findOne(userId, id);

    await this.prisma.workspace.delete({
      where: { id },
    });

    return { success: true };
  }

  private toDto(entity: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): WorkspaceDto {
    const createdAtStr =
      entity.createdAt instanceof Date
        ? entity.createdAt.toISOString()
        : new Date(entity.createdAt).toISOString();

    const updatedAtStr =
      entity.updatedAt instanceof Date
        ? entity.updatedAt.toISOString()
        : new Date(entity.updatedAt).toISOString();

    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      icon: entity.icon as WorkspaceIcon,
      color: entity.color as WorkspaceColor,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  }
}
