import { NotFoundException } from '@nestjs/common';
import { AreasService } from '../../src/modules/areas/areas.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('AreasService - delete', () => {
  let service: AreasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: jest.fn(),
      },
      area: {
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AreasService(mockPrisma as unknown as PrismaService);
  });

  it('should throw NotFoundException if workspace does not belong to user', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue(null);

    await expect(
      service.remove('user-1', 'ws-foreign', 'area-1'),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.area.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if area does not belong to workspace', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockResolvedValue(null);

    await expect(
      service.remove('user-1', 'ws-1', 'area-unknown'),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.area.delete).not.toHaveBeenCalled();
  });

  it('should successfully delete area when owned by user within workspace', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockResolvedValue({
      id: 'area-1',
      workspaceId: 'ws-1',
      name: 'To Delete',
    });
    mockPrisma.area.delete.mockResolvedValue({ id: 'area-1' });

    await service.remove('user-1', 'ws-1', 'area-1');

    expect(mockPrisma.area.delete).toHaveBeenCalledWith({
      where: { id: 'area-1' },
    });
  });
});

