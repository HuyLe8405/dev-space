import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      profile: {
        update: jest.fn(),
      },
    };
    service = new UsersService(mockPrisma as unknown as PrismaService);
  });

  describe('createUser', () => {
    it('should normalize email to lowercase and use email prefix as fallback display name', async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'alex@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        profile: { displayName: 'alex' },
      });

      const user = await service.createUser('ALEX@EXAMPLE.COM', 'hashed_pass');

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'alex@example.com',
            passwordHash: 'hashed_pass',
            profile: {
              create: {
                displayName: 'alex',
              },
            },
          }),
        }),
      );

      expect(user.displayName).toBe('alex');
      expect(user.email).toBe('alex@example.com');
    });

    it('should respect custom display name when provided', async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'sam@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        profile: { displayName: 'Sam Custom' },
      });

      const user = await service.createUser('sam@example.com', 'hashed_pass', 'Sam Custom');

      expect(user.displayName).toBe('Sam Custom');
    });
  });
});
