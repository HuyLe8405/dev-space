import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NodeRelationshipsService } from './node-relationships.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('NodeRelationshipsService', () => {
  let service: NodeRelationshipsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        findFirst: jest.fn(),
      },
      node: {
        findFirst: jest.fn(),
      },
      nodeRelationship: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new NodeRelationshipsService(
      mockPrisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
    });

    it('should reject self-referencing relationship with 400 Bad Request', async () => {
      await expect(
        service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
          sourceNodeId: 'node-1',
          targetNodeId: 'node-1',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.nodeRelationship.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if source or target node not found in project', async () => {
      mockPrisma.node.findFirst
        .mockResolvedValueOnce({ id: 'node-1', projectId: 'proj-1' })
        .mockResolvedValueOnce(null);

      await expect(
        service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
          sourceNodeId: 'node-1',
          targetNodeId: 'node-foreign',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.nodeRelationship.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate relationship between same node pair and type with 409 Conflict', async () => {
      mockPrisma.node.findFirst
        .mockResolvedValueOnce({ id: 'node-1', projectId: 'proj-1' })
        .mockResolvedValueOnce({ id: 'node-2', projectId: 'proj-1' });

      mockPrisma.nodeRelationship.findFirst.mockResolvedValue({
        id: 'rel-1',
        projectId: 'proj-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        type: 'DEPENDS_ON',
      });

      await expect(
        service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          type: 'depends_on',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.nodeRelationship.create).not.toHaveBeenCalled();
    });

    it('should create directed relationship with lowercase type mapping', async () => {
      mockPrisma.node.findFirst
        .mockResolvedValueOnce({ id: 'node-1', projectId: 'proj-1' })
        .mockResolvedValueOnce({ id: 'node-2', projectId: 'proj-1' });

      mockPrisma.nodeRelationship.findFirst.mockResolvedValue(null);
      const now = new Date();
      mockPrisma.nodeRelationship.create.mockResolvedValue({
        id: 'rel-new',
        projectId: 'proj-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        type: 'DEPENDS_ON',
        label: 'persists user session',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        type: 'depends_on',
        label: 'persists user session',
      });

      expect(mockPrisma.nodeRelationship.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          type: 'DEPENDS_ON',
          label: 'persists user session',
        },
      });
      expect(result.id).toBe('rel-new');
      expect(result.type).toBe('depends_on');
      expect(result.label).toBe('persists user session');
    });
  });

  describe('findAllForProject', () => {
    it('should return all relationships in project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      const now = new Date();
      mockPrisma.nodeRelationship.findMany.mockResolvedValue([
        {
          id: 'rel-1',
          projectId: 'proj-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          type: 'RELATES_TO',
          label: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.findAllForProject(
        'user-1',
        'ws-1',
        'area-1',
        'proj-1',
      );

      expect(result.total).toBe(1);
      expect(result.items[0].type).toBe('relates_to');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
    });

    it('should throw NotFoundException if relationship does not exist', async () => {
      mockPrisma.nodeRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'ws-1', 'area-1', 'proj-1', 'rel-invalid', {
          label: 'new label',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update relationship and return updated DTO', async () => {
      mockPrisma.nodeRelationship.findFirst
        .mockResolvedValueOnce({
          id: 'rel-1',
          projectId: 'proj-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          type: 'RELATES_TO',
        })
        .mockResolvedValueOnce(null); // No duplicate found

      const now = new Date();
      mockPrisma.nodeRelationship.update.mockResolvedValue({
        id: 'rel-1',
        projectId: 'proj-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        type: 'CONTAINS',
        label: 'subsystem link',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.update(
        'user-1',
        'ws-1',
        'area-1',
        'proj-1',
        'rel-1',
        {
          type: 'contains',
          label: 'subsystem link',
        },
      );

      expect(result.type).toBe('contains');
      expect(result.label).toBe('subsystem link');
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
    });

    it('should throw NotFoundException if relationship does not exist', async () => {
      mockPrisma.nodeRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'ws-1', 'area-1', 'proj-1', 'rel-invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete relationship when ownership verified', async () => {
      mockPrisma.nodeRelationship.findFirst.mockResolvedValue({
        id: 'rel-1',
        projectId: 'proj-1',
      });

      await service.remove('user-1', 'ws-1', 'area-1', 'proj-1', 'rel-1');

      expect(mockPrisma.nodeRelationship.delete).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
    });
  });
});
