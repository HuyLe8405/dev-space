import { NotFoundException } from '@nestjs/common';
import { AreasService } from '../../src/modules/areas/areas.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('AreasService - findOne & ownership', () => {
  let service: AreasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: jest.fn(),
      },
      area: {
        findFirst: jest.fn(),
      },
    };
    service = new AreasService(mockPrisma as unknown as PrismaService);
  });

  it('should throw uniform NotFoundException when workspace is not owned by user', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('user-1', 'ws-foreign', 'area-1'),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith({
      where: { id: 'ws-foreign', userId: 'user-1' },
    });
    expect(mockPrisma.area.findFirst).not.toHaveBeenCalled();
  });

  it('should throw uniform NotFoundException when area does not belong to specified workspace', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('user-1', 'ws-1', 'area-foreign'),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.area.findFirst).toHaveBeenCalledWith({
      where: { id: 'area-foreign', workspaceId: 'ws-1' },
    });
  });

  it('should return AreaDto when user owns workspace and area belongs to workspace', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    const now = new Date();
    mockPrisma.area.findFirst.mockResolvedValue({
      id: 'area-1',
      workspaceId: 'ws-1',
      name: 'Architecture',
      description: 'System design',
      icon: 'Layers',
      color: 'indigo',
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.findOne('user-1', 'ws-1', 'area-1');

    expect(result.id).toBe('area-1');
    expect(result.name).toBe('Architecture');
    expect(result.workspaceId).toBe('ws-1');
  });
});

