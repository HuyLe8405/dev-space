import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DEFAULT_PROJECT_COLOR, DEFAULT_PROJECT_ICON } from '@devspace/contracts';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      area: {
        findFirst: jest.fn(),
      },
      project: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ProjectsService(mockPrisma as unknown as PrismaService);
  });

  describe('verifyAreaOwnership', () => {
    it('should throw NotFoundException if area does not belong to user workspace', async () => {
      mockPrisma.area.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyAreaOwnership('user-1', 'ws-1', 'area-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.area.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'area-1',
          workspaceId: 'ws-1',
          workspace: { userId: 'user-1' },
        },
      });
    });

    it('should return area if ownership is verified', async () => {
      const mockArea = { id: 'area-1', workspaceId: 'ws-1', name: 'Backend' };
      mockPrisma.area.findFirst.mockResolvedValue(mockArea);

      const result = await service.verifyAreaOwnership('user-1', 'ws-1', 'area-1');
      expect(result).toEqual(mockArea);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
    });

    it('should reject creation when name is empty or whitespace only', async () => {
      await expect(
        service.create('user-1', 'ws-1', 'area-1', { name: '   ' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('should reject creation with 409 Conflict if project name already exists in area', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'p-1',
        name: 'DevSpace API',
        areaId: 'area-1',
      });

      await expect(
        service.create('user-1', 'ws-1', 'area-1', { name: 'devspace api' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('should create project with trimmed name and default icon/color when omitted', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      const now = new Date();
      mockPrisma.project.create.mockResolvedValue({
        id: 'p-new',
        areaId: 'area-1',
        name: 'DevSpace API',
        description: null,
        icon: DEFAULT_PROJECT_ICON,
        color: DEFAULT_PROJECT_COLOR,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', 'ws-1', 'area-1', {
        name: '  DevSpace API  ',
      });

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          areaId: 'area-1',
          name: 'DevSpace API',
          description: null,
          icon: DEFAULT_PROJECT_ICON,
          color: DEFAULT_PROJECT_COLOR,
        },
      });
      expect(result.name).toBe('DevSpace API');
      expect(result.icon).toBe(DEFAULT_PROJECT_ICON);
      expect(result.color).toBe(DEFAULT_PROJECT_COLOR);
      expect(result.nodeCount).toBe(0);
    });
  });

  describe('findAllForArea', () => {
    it('should return projects ordered by updatedAt descending with node counts', async () => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      const now = new Date();
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p-1',
          areaId: 'area-1',
          name: 'API',
          description: 'Backend',
          icon: 'Folder',
          color: 'cyan',
          createdAt: now,
          updatedAt: now,
          _count: { nodes: 3 },
        },
      ]);

      const result = await service.findAllForArea('user-1', 'ws-1', 'area-1');

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { areaId: 'area-1' },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { nodes: true } } },
      });
      expect(result.total).toBe(1);
      expect(result.items[0].nodeCount).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if project not found in area', async () => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'ws-1', 'area-1', 'p-invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return project details with node count', async () => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      const now = new Date();
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'p-1',
        areaId: 'area-1',
        name: 'API',
        description: 'Backend',
        icon: 'Folder',
        color: 'cyan',
        createdAt: now,
        updatedAt: now,
        _count: { nodes: 5 },
      });

      const result = await service.findOne('user-1', 'ws-1', 'area-1', 'p-1');
      expect(result.id).toBe('p-1');
      expect(result.nodeCount).toBe(5);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'p-1',
        areaId: 'area-1',
        name: 'API',
      });
    });

    it('should reject update if renamed to existing project in area', async () => {
      // Duplicate found
      mockPrisma.project.findFirst
        .mockResolvedValueOnce({ id: 'p-1', areaId: 'area-1', name: 'API' })
        .mockResolvedValueOnce({ id: 'p-2', areaId: 'area-1', name: 'Web' });

      await expect(
        service.update('user-1', 'ws-1', 'area-1', 'p-1', { name: 'Web' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('should update project attributes and return updated DTO', async () => {
      const now = new Date();
      mockPrisma.project.findFirst
        .mockResolvedValueOnce({ id: 'p-1', areaId: 'area-1', name: 'API' })
        .mockResolvedValueOnce(null);

      mockPrisma.project.update.mockResolvedValue({
        id: 'p-1',
        areaId: 'area-1',
        name: 'DevSpace Core API',
        description: 'Updated description',
        icon: 'Boxes',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
        _count: { nodes: 2 },
      });

      const result = await service.update('user-1', 'ws-1', 'area-1', 'p-1', {
        name: 'DevSpace Core API',
        description: 'Updated description',
        icon: 'Boxes',
        color: 'blue',
      });

      expect(result.name).toBe('DevSpace Core API');
      expect(result.icon).toBe('Boxes');
      expect(result.nodeCount).toBe(2);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'ws-1', 'area-1', 'p-not-found'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should delete project when ownership verified', async () => {
      mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1' });
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p-1', areaId: 'area-1' });

      await service.remove('user-1', 'ws-1', 'area-1', 'p-1');

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
    });
  });
});

