import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_RELATION_TYPE,
  NodeRelationshipDto,
  NodeRelationshipListResponse,
  RelationType,
} from '@devspace/contracts';
import { RelationType as PrismaRelationType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNodeRelationshipDto } from './dto/create-node-relationship.dto';
import { UpdateNodeRelationshipDto } from './dto/update-node-relationship.dto';

@Injectable()
export class NodeRelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(rel: {
    id: string;
    projectId: string;
    sourceNodeId: string;
    targetNodeId: string;
    type: PrismaRelationType | string;
    label: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): NodeRelationshipDto {
    const createdAtStr =
      rel.createdAt instanceof Date
        ? rel.createdAt.toISOString()
        : new Date(rel.createdAt).toISOString();

    const updatedAtStr =
      rel.updatedAt instanceof Date
        ? rel.updatedAt.toISOString()
        : new Date(rel.updatedAt).toISOString();

    return {
      id: rel.id,
      projectId: rel.projectId,
      sourceNodeId: rel.sourceNodeId,
      targetNodeId: rel.targetNodeId,
      type: rel.type.toLowerCase() as RelationType,
      label: rel.label,
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
    dto: CreateNodeRelationshipDto,
  ): Promise<NodeRelationshipDto> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    if (dto.sourceNodeId === dto.targetNodeId) {
      throw new BadRequestException(
        'A node cannot have a relationship with itself',
      );
    }

    const [sourceNode, targetNode] = await Promise.all([
      this.prisma.node.findFirst({
        where: { id: dto.sourceNodeId, projectId },
      }),
      this.prisma.node.findFirst({
        where: { id: dto.targetNodeId, projectId },
      }),
    ]);

    if (!sourceNode || !targetNode) {
      throw new NotFoundException(
        'One or both nodes were not found in this project',
      );
    }

    const relType = (
      dto.type ? dto.type.toUpperCase() : 'RELATES_TO'
    ) as PrismaRelationType;

    const existing = await this.prisma.nodeRelationship.findFirst({
      where: {
        projectId,
        sourceNodeId: dto.sourceNodeId,
        targetNodeId: dto.targetNodeId,
        type: relType,
      },
    });

    if (existing) {
      throw new ConflictException(
        'This relationship already exists between the specified nodes',
      );
    }

    const relationship = await this.prisma.nodeRelationship.create({
      data: {
        projectId,
        sourceNodeId: dto.sourceNodeId,
        targetNodeId: dto.targetNodeId,
        type: relType,
        label: dto.label?.trim() || null,
      },
    });

    return this.toDto(relationship);
  }

  async findAllForProject(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
  ): Promise<NodeRelationshipListResponse> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const relationships = await this.prisma.nodeRelationship.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: relationships.map((r) => this.toDto(r)),
      total: relationships.length,
    };
  }

  async update(
    userId: string,
    workspaceId: string,
    areaId: string,
    projectId: string,
    relationshipId: string,
    dto: UpdateNodeRelationshipDto,
  ): Promise<NodeRelationshipDto> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const existingRel = await this.prisma.nodeRelationship.findFirst({
      where: {
        id: relationshipId,
        projectId,
      },
    });

    if (!existingRel) {
      throw new NotFoundException('Relationship not found');
    }

    const relType = dto.type
      ? (dto.type.toUpperCase() as PrismaRelationType)
      : undefined;

    // If type is changing, check duplicate
    if (relType && relType !== existingRel.type) {
      const duplicate = await this.prisma.nodeRelationship.findFirst({
        where: {
          projectId,
          sourceNodeId: existingRel.sourceNodeId,
          targetNodeId: existingRel.targetNodeId,
          type: relType,
          NOT: {
            id: relationshipId,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'A relationship with this type already exists between these nodes',
        );
      }
    }

    const updated = await this.prisma.nodeRelationship.update({
      where: { id: relationshipId },
      data: {
        ...(relType !== undefined && { type: relType }),
        ...(dto.label !== undefined && {
          label: dto.label ? dto.label.trim() : null,
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
    relationshipId: string,
  ): Promise<void> {
    await this.verifyProjectOwnership(userId, workspaceId, areaId, projectId);

    const existingRel = await this.prisma.nodeRelationship.findFirst({
      where: {
        id: relationshipId,
        projectId,
      },
    });

    if (!existingRel) {
      throw new NotFoundException('Relationship not found');
    }

    await this.prisma.nodeRelationship.delete({
      where: { id: relationshipId },
    });
  }
}

