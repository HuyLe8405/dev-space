import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockUsersService: any;
  let mockPasswordService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    mockUsersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
    };
    mockPasswordService = {
      validatePasswordComplexity: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn(() => 'signed_token_mock'),
      verify: jest.fn(),
    };

    authService = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockUsersService as unknown as UsersService,
      mockPasswordService as unknown as PasswordService,
      mockJwtService as unknown as JwtService,
    );
  });

  describe('register (FR-001, FR-003, FR-005)', () => {
    it('should throw BadRequestException if password does not meet complexity', async () => {
      mockPasswordService.validatePasswordComplexity.mockReturnValue(false);

      await expect(
        authService.register('test@example.com', 'weakpass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw generic BadRequestException if email is already taken (FR-005)', async () => {
      mockPasswordService.validatePasswordComplexity.mockReturnValue(true);
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register('test@example.com', 'Password123'),
      ).rejects.toThrow('Registration cannot be completed with this email');
    });

    it('should create user, session, and return tokens upon valid registration', async () => {
      mockPasswordService.validatePasswordComplexity.mockReturnValue(true);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue('hashed_pw');
      mockUsersService.createUser.mockResolvedValue({
        id: 'new-user',
        email: 'test@example.com',
        displayName: 'test',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });
      mockPrisma.session.update.mockResolvedValue({ id: 'session-123' });

      const result = await authService.register('test@example.com', 'Password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('signed_token_mock');
      expect(result.refreshToken).toBe('signed_token_mock');
      expect(result.expiresIn).toBe(900);
    });
  });

  describe('login (FR-004, FR-005)', () => {
    it('should throw generic UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('unknown@example.com', 'Password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw generic UnauthorizedException if password incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        isActive: true,
      });
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'WrongPassword123'),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout (FR-008)', () => {
    it('should set isRevoked true on the active session', async () => {
      await authService.logout('session-123');

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { isRevoked: true },
      });
    });
  });

  describe('changePassword (FR-015, FR-016)', () => {
    it('should reject if current password is incorrect', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user-1',
        passwordHash: 'old-hash',
        profile: { displayName: 'alex' },
      });
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', 'session-1', 'WrongOld', 'NewPassword123'),
      ).rejects.toThrow('Incorrect current password');
    });

    it('should reject if new password fails complexity', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user-1',
        passwordHash: 'old-hash',
        profile: { displayName: 'alex' },
      });
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockPasswordService.validatePasswordComplexity.mockReturnValue(false);

      await expect(
        authService.changePassword('user-1', 'session-1', 'OldPassword123', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update hash, revoke other sessions, and rotate current session', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'alex@example.com',
        passwordHash: 'old-hash',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        profile: { displayName: 'alex' },
      });
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockPasswordService.validatePasswordComplexity.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('new-hash');
      mockUsersService.updatePasswordHash = jest.fn().mockResolvedValue(undefined);
      mockPrisma.session.updateMany = jest.fn().mockResolvedValue({ count: 2 });
      mockPrisma.session.update = jest.fn().mockResolvedValue({ id: 'session-1' });

      const result = await authService.changePassword(
        'user-1',
        'session-1',
        'OldPassword123',
        'NewPassword456',
      );

      expect(mockUsersService.updatePasswordHash).toHaveBeenCalledWith('user-1', 'new-hash');
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          id: { not: 'session-1' },
        },
        data: { isRevoked: true },
      });
      expect(result.accessToken).toBe('signed_token_mock');
    });
  });
});
