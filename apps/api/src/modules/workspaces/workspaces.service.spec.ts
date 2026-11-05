import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new WorkspacesService(mockPrisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('should create a workspace with trimmed name and default icon/color', async () => {
      const now = new Date();
      mockPrisma.workspace.create.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'My Workspace',
        description: null,
        icon: 'Briefcase',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', {
        name: '  My Workspace  ',
      });

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'My Workspace',
          description: null,
          icon: 'Briefcase',
          color: 'blue',
        },
      });

      expect(result.id).toBe('ws-1');
      expect(result.name).toBe('My Workspace');
      expect(result.icon).toBe('Briefcase');
      expect(result.color).toBe('blue');
    });

    it('should reject creation when name is empty or whitespace only', async () => {
      await expect(
        service.create('user-1', {
          name: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow custom icon, color, and description', async () => {
      const now = new Date();
      mockPrisma.workspace.create.mockResolvedValue({
        id: 'ws-2',
        userId: 'user-1',
        name: 'Engineering',
        description: 'Core projects',
        icon: 'Code',
        color: 'cyan',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.create('user-1', {
        name: 'Engineering',
        description: '  Core projects  ',
        icon: 'Code',
        color: 'cyan',
      });

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'Engineering',
          description: 'Core projects',
          icon: 'Code',
          color: 'cyan',
        },
      });

      expect(result.icon).toBe('Code');
      expect(result.color).toBe('cyan');
      expect(result.description).toBe('Core projects');
    });
  });

  describe('findAllForUser', () => {
    it('should return workspaces for the user sorted by createdAt desc', async () => {
      const now = new Date();
      mockPrisma.workspace.findMany.mockResolvedValue([
        {
          id: 'ws-2',
          userId: 'user-1',
          name: 'Latest Workspace',
          description: null,
          icon: 'Layers',
          color: 'indigo',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'ws-1',
          userId: 'user-1',
          name: 'First Workspace',
          description: null,
          icon: 'Briefcase',
          color: 'blue',
          createdAt: new Date(now.getTime() - 10000),
          updatedAt: new Date(now.getTime() - 10000),
        },
      ]);

      const result = await service.findAllForUser('user-1');

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result.total).toBe(2);
      expect(result.items[0].name).toBe('Latest Workspace');
    });
  });

  describe('findOne', () => {
    it('should return workspace when found for the user', async () => {
      const now = new Date();
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'Personal',
        description: null,
        icon: 'Briefcase',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.findOne('user-1', 'ws-1');

      expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith({
        where: { id: 'ws-1', userId: 'user-1' },
      });
      expect(result.id).toBe('ws-1');
    });

    it('should throw NotFoundException when workspace is foreign or does not exist', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'ws-foreign')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update provided fields and preserve unmodified fields', async () => {
      const now = new Date();
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'Original',
        description: 'Original description',
        icon: 'Briefcase',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });

      mockPrisma.workspace.update.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'Updated Name',
        description: 'Original description',
        icon: 'Code',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.update('user-1', 'ws-1', {
        name: '  Updated Name  ',
        icon: 'Code',
      });

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: {
          name: 'Updated Name',
          icon: 'Code',
        },
      });

      expect(result.name).toBe('Updated Name');
      expect(result.icon).toBe('Code');
      expect(result.description).toBe('Original description');
    });

    it('should throw BadRequestException if updated name is empty string', async () => {
      const now = new Date();
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'Original',
        description: null,
        icon: 'Briefcase',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });

      await expect(
        service.update('user-1', 'ws-1', { name: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete workspace when owned by user', async () => {
      const now = new Date();
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 'ws-1',
        userId: 'user-1',
        name: 'To Delete',
        description: null,
        icon: 'Briefcase',
        color: 'blue',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.workspace.delete.mockResolvedValue({});

      const result = await service.remove('user-1', 'ws-1');

      expect(mockPrisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
      });
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when trying to delete foreign workspace', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'ws-foreign')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.workspace.delete).not.toHaveBeenCalled();
    });
  });
});

