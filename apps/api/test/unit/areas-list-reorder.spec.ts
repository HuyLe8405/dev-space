import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AreasService } from '../../src/modules/areas/areas.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('AreasService - list and reorder', () => {
  let service: AreasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: jest.fn(),
      },
      area: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };
    service = new AreasService(mockPrisma as unknown as PrismaService);
  });

  describe('findAllForWorkspace', () => {
    it('should throw NotFoundException if workspace does not belong to user', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllForWorkspace('user-1', 'ws-foreign'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith({
        where: { id: 'ws-foreign', userId: 'user-1' },
      });
      expect(mockPrisma.area.findMany).not.toHaveBeenCalled();
    });

    it('should return areas ordered by order: asc', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
      const now = new Date();
      mockPrisma.area.findMany.mockResolvedValue([
        {
          id: 'area-1',
          workspaceId: 'ws-1',
          name: 'Area 1',
          description: null,
          icon: 'Layers',
          color: 'indigo',
          order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'area-2',
          workspaceId: 'ws-1',
          name: 'Area 2',
          description: null,
          icon: 'Terminal',
          color: 'blue',
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.findAllForWorkspace('user-1', 'ws-1');

      expect(mockPrisma.area.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { order: 'asc' },
      });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].id).toBe('area-1');
      expect(result.items[1].id).toBe('area-2');
    });
  });

  describe('reorder', () => {
    it('should throw NotFoundException if workspace does not belong to user', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);

      await expect(
        service.reorder('user-1', 'ws-foreign', { areaIds: ['area-1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject reorder when payload IDs length does not match workspace area count', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
      mockPrisma.area.findMany.mockResolvedValueOnce([
        { id: 'area-1' },
        { id: 'area-2' },
      ]);

      await expect(
        service.reorder('user-1', 'ws-1', { areaIds: ['area-1'] }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reject reorder when payload contains an invalid or foreign area ID', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
      mockPrisma.area.findMany.mockResolvedValueOnce([
        { id: 'area-1' },
        { id: 'area-2' },
      ]);

      await expect(
        service.reorder('user-1', 'ws-1', { areaIds: ['area-1', 'area-unknown'] }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should atomically update area sequence in a single transaction', async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
      mockPrisma.area.findMany
        .mockResolvedValueOnce([{ id: 'area-1' }, { id: 'area-2' }]) // validate existing
        .mockResolvedValueOnce([
          {
            id: 'area-2',
            workspaceId: 'ws-1',
            name: 'Area 2',
            description: null,
            icon: 'Terminal',
            color: 'blue',
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'area-1',
            workspaceId: 'ws-1',
            name: 'Area 1',
            description: null,
            icon: 'Layers',
            color: 'indigo',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]); // findAllForWorkspace

      const result = await service.reorder('user-1', 'ws-1', {
        areaIds: ['area-2', 'area-1'],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.items[0].id).toBe('area-2');
      expect(result.items[1].id).toBe('area-1');
    });
  });
});

