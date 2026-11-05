import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NodesService } from './nodes.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('NodesService', () => {
  let service: NodesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        findFirst: jest.fn(),
      },
      node: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new NodesService(mockPrisma as unknown as PrismaService);
  });

  describe('verifyProjectOwnership', () => {
    it('should throw NotFoundException if project does not belong to user hierarchy', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyProjectOwnership('user-1', 'ws-1', 'area-1', 'proj-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'proj-1',
          areaId: 'area-1',
          area: {
            workspaceId: 'ws-1',
            workspace: { userId: 'user-1' },
          },
        },
      });
    });

    it('should return project if ownership is verified', async () => {
      const mockProject = { id: 'proj-1', areaId: 'area-1', name: 'DevSpace API' };
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.verifyProjectOwnership(
        'user-1',
        'ws-1',
        'area-1',
        'proj-1',
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
    });

    it('should reject creation when name is empty or whitespace only', async () => {
      await expect(
        service.create('user-1', 'ws-1', 'area-1', 'proj-1', { name: '   ' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.node.create).not.toHaveBeenCalled();
    });

    it('should reject creation with 409 Conflict if node name already exists in project', async () => {
      mockPrisma.node.findFirst.mockResolvedValue({
        id: 'node-1',
        name: 'Auth Module',
        projectId: 'proj-1',
      });

      await expect(
        service.create('user-1', 'ws-1', 'area-1', 'proj-1', { name: 'auth module' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.node.create).not.toHaveBeenCalled();
    });

    it('should create node with trimmed name and default CONCEPT type', async () => {
      mockPrisma.node.findFirst.mockResolvedValue(null);
      const now = new Date();
      mockPrisma.node.create.mockResolvedValue({
        id: 'node-new',
        projectId: 'proj-1',
        name: 'Auth Module',
        description: null,
        nodeType: 'CONCEPT',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
        name: '  Auth Module  ',
      });

      expect(mockPrisma.node.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          name: 'Auth Module',
          description: null,
          nodeType: 'CONCEPT',
        },
      });
      expect(result.name).toBe('Auth Module');
      expect(result.nodeType).toBe('concept');
    });

    it('should create node with specified nodeType', async () => {
      mockPrisma.node.findFirst.mockResolvedValue(null);
      const now = new Date();
      mockPrisma.node.create.mockResolvedValue({
        id: 'node-new',
        projectId: 'proj-1',
        name: 'User Database',
        description: 'PostgreSQL storage',
        nodeType: 'DATABASE',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', 'ws-1', 'area-1', 'proj-1', {
        name: 'User Database',
        description: 'PostgreSQL storage',
        nodeType: 'database',
      });

      expect(mockPrisma.node.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          name: 'User Database',
          description: 'PostgreSQL storage',
          nodeType: 'DATABASE',
        },
      });
      expect(result.nodeType).toBe('database');
    });
  });

  describe('findAllForProject', () => {
    it('should return nodes ordered by createdAt ascending', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      const now = new Date();
      mockPrisma.node.findMany.mockResolvedValue([
        {
          id: 'n-1',
          projectId: 'proj-1',
          name: 'Auth',
          description: null,
          nodeType: 'MODULE',
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

      expect(mockPrisma.node.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result.total).toBe(1);
      expect(result.items[0].nodeType).toBe('module');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if node not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      mockPrisma.node.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'ws-1', 'area-1', 'proj-1', 'n-invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return node details', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      const now = new Date();
      mockPrisma.node.findFirst.mockResolvedValue({
        id: 'n-1',
        projectId: 'proj-1',
        name: 'Auth',
        description: null,
        nodeType: 'SERVICE',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.findOne('user-1', 'ws-1', 'area-1', 'proj-1', 'n-1');
      expect(result.id).toBe('n-1');
      expect(result.nodeType).toBe('service');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      mockPrisma.node.findFirst.mockResolvedValue({
        id: 'n-1',
        projectId: 'proj-1',
        name: 'Auth',
      });
    });

    it('should reject update if renamed to existing node in project', async () => {
      mockPrisma.node.findFirst
        .mockResolvedValueOnce({ id: 'n-1', projectId: 'proj-1', name: 'Auth' })
        .mockResolvedValueOnce({ id: 'n-2', projectId: 'proj-1', name: 'Database' });

      await expect(
        service.update('user-1', 'ws-1', 'area-1', 'proj-1', 'n-1', {
          name: 'Database',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.node.update).not.toHaveBeenCalled();
    });

    it('should update node and map uppercase enum to lowercase', async () => {
      const now = new Date();
      mockPrisma.node.findFirst
        .mockResolvedValueOnce({ id: 'n-1', projectId: 'proj-1', name: 'Auth' })
        .mockResolvedValueOnce(null);

      mockPrisma.node.update.mockResolvedValue({
        id: 'n-1',
        projectId: 'proj-1',
        name: 'Authentication Core',
        description: 'Updated auth service',
        nodeType: 'SERVICE',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.update('user-1', 'ws-1', 'area-1', 'proj-1', 'n-1', {
        name: 'Authentication Core',
        description: 'Updated auth service',
        nodeType: 'service',
      });

      expect(result.name).toBe('Authentication Core');
      expect(result.nodeType).toBe('service');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if node not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      mockPrisma.node.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'ws-1', 'area-1', 'proj-1', 'n-invalid'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.node.delete).not.toHaveBeenCalled();
    });

    it('should delete node when ownership verified', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', areaId: 'area-1' });
      mockPrisma.node.findFirst.mockResolvedValue({ id: 'n-1', projectId: 'proj-1' });

      await service.remove('user-1', 'ws-1', 'area-1', 'proj-1', 'n-1');

      expect(mockPrisma.node.delete).toHaveBeenCalledWith({
        where: { id: 'n-1' },
      });
    });
  });
});

