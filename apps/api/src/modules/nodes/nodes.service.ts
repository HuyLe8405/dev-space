import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_NODE_TYPE,
  NodeDto,
  NodeListResponse,
  NodeType,
} from '@devspace/contracts';
import { NodeType as PrismaNodeType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(node: {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    nodeType: PrismaNodeType | string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): NodeDto {
    const createdAtStr =
      node.createdAt instanceof Date
        ? node.createdAt.toISOString()
        : new Date(node.createdAt).toISOString();

    const updatedAtStr =
      node.updatedAt instanceof Date
        ? node.updatedAt.toISOString()
        : new Date(node.updatedAt).toISOString();

    return {
      id: node.id,
      projectId: node.projectId,
      name: node.name,
      description: node.description,
      nodeType: node.nodeType.toLowerCase() as NodeType,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };
  }

  async verifyProjectOwnership(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        areaId,
        area: {
          workspaceId,
          workspace: {
            userId,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    dto: CreateNodeDto,
  ): Promise<NodeDto> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const trimmedName = dto.name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Node name cannot be empty');
    }

    // Case-insensitive duplicate name check within project
    const existing = await this.prisma.node.findFirst({
      where: {
        projectId,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A node with the name "${trimmedName}" already exists in this project`,
      );
    }

    const nodeType = (
      dto.nodeType ? dto.nodeType.toUpperCase() : 'CONCEPT'
    ) as PrismaNodeType;

    const node = await this.prisma.node.create({
      data: {
        projectId,
        name: trimmedName,
        description: dto.description?.trim() || null,
        nodeType,
      },
    });

    return this.toDto(node);
  }

  async findAllForProject(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
  ): Promise<NodeListResponse> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const nodes = await this.prisma.node.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: nodes.map((n) => this.toDto(n)),
      total: nodes.length,
    };
  }

  async findOne(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    nodeId: string,
  ): Promise<NodeDto> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        projectId,
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return this.toDto(node);
  }

  async update(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    nodeId: string,
    dto: UpdateNodeDto,
  ): Promise<NodeDto> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const existingNode = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        projectId,
      },
    });

    if (!existingNode) {
      throw new NotFoundException('Node not found');
    }

    let updateName: string | undefined = undefined;
    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Node name cannot be empty');
      }

      // Check case-insensitive duplicate if name is changing
      if (trimmedName.toLowerCase() !== existingNode.name.toLowerCase()) {
        const duplicate = await this.prisma.node.findFirst({
          where: {
            projectId,
            name: {
              equals: trimmedName,
              mode: 'insensitive',
            },
            NOT: {
              id: nodeId,
            },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            `A node with the name "${trimmedName}" already exists in this project`,
          );
        }
      }

      updateName = trimmedName;
    }

    const updated = await this.prisma.node.update({
      where: { id: nodeId },
      data: {
        ...(updateName !== undefined && { name: updateName }),
        ...(dto.description !== undefined && {
          description: dto.description ? dto.description.trim() : null,
        }),
        ...(dto.nodeType !== undefined && {
          nodeType: dto.nodeType.toUpperCase() as PrismaNodeType,
        }),
      },
    });

    return this.toDto(updated);
  }

  async remove(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    nodeId: string,
  ): Promise<void> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        projectId,
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    await this.prisma.node.delete({
      where: { id: nodeId },
    });
  }
}

