import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AreasService } from '../../src/modules/areas/areas.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { DEFAULT_AREA_COLOR, DEFAULT_AREA_ICON } from '@devspace/contracts';

describe('AreasService - create', () => {
  let service: AreasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: jest.fn(),
      },
      area: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new AreasService(mockPrisma as unknown as PrismaService);
  });

  it('should verify workspace ownership and throw NotFoundException if workspace does not belong to user', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', 'ws-foreign', { name: 'Frontend' }),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith({
      where: { id: 'ws-foreign', userId: 'user-1' },
    });
    expect(mockPrisma.area.create).not.toHaveBeenCalled();
  });

  it('should reject creation when name is empty or whitespace only', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });

    await expect(
      service.create('user-1', 'ws-1', { name: '   ' }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.area.create).not.toHaveBeenCalled();
  });

  it('should reject creation with 409 Conflict if area name already exists in workspace (case-insensitive)', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockImplementation(async ({ where }) => {
      if (where.name) {
        return { id: 'existing-area', name: 'Frontend', workspaceId: 'ws-1' };
      }
      return null;
    });

    await expect(
      service.create('user-1', 'ws-1', { name: 'frontend' }),
    ).rejects.toThrow(ConflictException);

    expect(mockPrisma.area.create).not.toHaveBeenCalled();
  });

  it('should create first area with sequential order 0 and default icon/color', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    // First call to findFirst is for duplicate name check -> returns null
    // Second call is for maxOrderArea -> returns null
    mockPrisma.area.findFirst.mockResolvedValue(null);

    const now = new Date();
    mockPrisma.area.create.mockResolvedValue({
      id: 'area-1',
      workspaceId: 'ws-1',
      name: 'Architecture',
      description: null,
      icon: DEFAULT_AREA_ICON,
      color: DEFAULT_AREA_COLOR,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.create('user-1', 'ws-1', {
      name: '  Architecture  ',
    });

    expect(mockPrisma.area.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'ws-1',
        name: 'Architecture',
        description: null,
        icon: DEFAULT_AREA_ICON,
        color: DEFAULT_AREA_COLOR,
        order: 0,
      },
    });

    expect(result.id).toBe('area-1');
    expect(result.name).toBe('Architecture');
    expect(result.order).toBe(0);
    expect(result.icon).toBe(DEFAULT_AREA_ICON);
    expect(result.color).toBe(DEFAULT_AREA_COLOR);
  });

  it('should calculate sequential order = max(order) + 1 for subsequent areas', async () => {
    mockPrisma.workspace.findFirst.mockResolvedValue({ id: 'ws-1', userId: 'user-1' });
    mockPrisma.area.findFirst.mockImplementation(async ({ where, orderBy }) => {
      if (orderBy && orderBy.order === 'desc') {
        return { order: 2 };
      }
      return null; // duplicate check
    });

    const now = new Date();
    mockPrisma.area.create.mockResolvedValue({
      id: 'area-3',
      workspaceId: 'ws-1',
      name: 'Backend',
      description: 'Core API services',
      icon: 'Server',
      color: 'emerald',
      order: 3,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.create('user-1', 'ws-1', {
      name: 'Backend',
      description: 'Core API services',
      icon: 'Server',
      color: 'emerald',
    });

    expect(mockPrisma.area.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'ws-1',
        name: 'Backend',
        description: 'Core API services',
        icon: 'Server',
        color: 'emerald',
        order: 3,
      },
    });

    expect(result.order).toBe(3);
  });
});

