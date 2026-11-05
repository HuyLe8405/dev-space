import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AreasService } from '../../src/modules/areas/areas.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('AreasService - update', () => {
  let service: AreasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: jest.fn(),
      },
      area: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AreasService(mockPrisma as unknown as PrismaService);
  });

  it('should throw NotFoundException if workspace does not belong to user', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'ws-foreign', 'area-1', { name: 'New Name' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if area does not exist in workspace', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'ws-1', 'area-unknown', { name: 'New Name' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject update if new name is empty or whitespace only', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockResolvedValue({ id: 'area-1', workspaceId: 'ws-1', name: 'Old' });

    await expect(
      service.update('user-1', 'ws-1', 'area-1', { name: '   ' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject update with 409 Conflict if new name conflicts with a sibling area', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    // First call: find the target area to edit
    mockPrisma.area.findFirst
      .mockResolvedValueOnce({ id: 'area-1', workspaceId: 'ws-1', name: 'Original' })
      // Second call: sibling name collision check
      .mockResolvedValueOnce({ id: 'area-2', workspaceId: 'ws-1', name: 'Sibling' });

    await expect(
      service.update('user-1', 'ws-1', 'area-1', { name: 'sibling' }),
    ).rejects.toThrow(ConflictException);

    expect(mockPrisma.area.update).not.toHaveBeenCalled();
  });

  it('should allow updating attributes while preserving unmodified fields', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst
      .mockResolvedValueOnce({
        id: 'area-1',
        workspaceId: 'ws-1',
        name: 'Original',
        description: 'Old desc',
        icon: 'Layers',
        color: 'indigo',
        order: 0,
      })
      .mockResolvedValueOnce(null); // No collision

    const now = new Date();
    mockPrisma.area.update.mockResolvedValue({
      id: 'area-1',
      workspaceId: 'ws-1',
      name: 'Updated Name',
      description: 'Old desc',
      icon: 'Terminal',
      color: 'indigo',
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.update('user-1', 'ws-1', 'area-1', {
      name: '  Updated Name  ',
      icon: 'Terminal',
    });

    expect(mockPrisma.area.update).toHaveBeenCalledWith({
      where: { id: 'area-1' },
      data: {
        name: 'Updated Name',
        icon: 'Terminal',
      },
    });

    expect(result.name).toBe('Updated Name');
    expect(result.icon).toBe('Terminal');
  });
});

