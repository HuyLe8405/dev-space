import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import type { UserSummary, AuthSessionResponse } from '@devspace/contracts';

export interface TokenBundle {
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly accessSecret =
    process.env.JWT_ACCESS_SECRET || 'dev-insecure-access-secret-32-chars-minimum!!';
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET || 'dev-insecure-refresh-secret-32-chars-minimum!!';
  private readonly accessExpiresInSeconds = 900; // 15 minutes
  private readonly refreshExpiresInDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(user: UserSummary, sessionId: string): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        sessionId,
      },
      {
        secret: this.accessSecret,
        expiresIn: `${this.accessExpiresInSeconds}s`,
      },
    );
  }

  private generateRefreshToken(sessionId: string): string {
    const rawSecret = crypto.randomBytes(40).toString('hex');
    return this.jwtService.sign(
      {
        sessionId,
        tokenSecret: rawSecret,
      },
      {
        secret: this.refreshSecret,
        expiresIn: `${this.refreshExpiresInDays}d`,
      },
    );
  }

  async register(
    email: string,
    password: string,
    displayName?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenBundle> {
    if (!this.passwordService.validatePasswordComplexity(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters',
      );
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      // Non-confirming error per FR-005 & Q1 clarification
      throw new BadRequestException('Registration cannot be completed with this email');
    }

    const passwordHash = await this.passwordService.hashPassword(password);
    const user = await this.usersService.createUser(email, passwordHash, displayName);

    return this.createSessionAndIssueTokens(user, userAgent, ipAddress);
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenBundle> {
    const genericErrorMessage = 'Invalid email or password';
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException(genericErrorMessage);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(genericErrorMessage);
    }

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName || user.email.split('@')[0],
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
    };

    return this.createSessionAndIssueTokens(userSummary, userAgent, ipAddress);
  }

  async refreshSession(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenBundle> {
    let payload: { sessionId: string; tokenSecret: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (
      !session ||
      session.isRevoked ||
      session.expiresAt < new Date() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException('Session has expired or was revoked');
    }

    const hashedIncoming = this.hashToken(refreshToken);
    if (session.hashedRefreshToken !== hashedIncoming) {
      // Token reuse / tampering detected: invalidate entire session
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token reuse detected. Session invalidated.');
    }

    const userSummary: UserSummary = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.profile?.displayName || session.user.email.split('@')[0],
      createdAt:
        session.user.createdAt instanceof Date
          ? session.user.createdAt.toISOString()
          : new Date(session.user.createdAt).toISOString(),
    };

    // Rotate refresh token
    const newRefreshToken = this.generateRefreshToken(session.id);
    const newHashedRefresh = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        hashedRefreshToken: newHashedRefresh,
        expiresAt: newExpiresAt,
        userAgent: userAgent || session.userAgent,
        ipAddress: ipAddress || session.ipAddress,
      },
    });

    const accessToken = this.generateAccessToken(userSummary, session.id);

    return {
      user: userSummary,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }

  async logout(sessionId: string): Promise<void> {
    if (!sessionId) return;
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });
    } catch {
      // Session may already be deleted/absent
    }
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<TokenBundle> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await this.passwordService.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Incorrect current password');
    }

    if (!this.passwordService.validatePasswordComplexity(newPassword)) {
      throw new BadRequestException(
        'New password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters',
      );
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const newHash = await this.passwordService.hashPassword(newPassword);
    await this.usersService.updatePasswordHash(userId, newHash);

    // Invalidate all other active sessions across other devices/tabs (FR-016 / Q2)
    await this.prisma.session.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
      data: { isRevoked: true },
    });

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName || user.email.split('@')[0],
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
    };

    // Rotate tokens for the current session
    const newRefreshToken = this.generateRefreshToken(currentSessionId);
    const newHashedRefresh = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + this.refreshExpiresInDays);

    await this.prisma.session.update({
      where: { id: currentSessionId },
      data: {
        hashedRefreshToken: newHashedRefresh,
        expiresAt: newExpiresAt,
      },
    });

    const accessToken = this.generateAccessToken(userSummary, currentSessionId);

    return {
      user: userSummary,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }

  private async createSessionAndIssueTokens(
    user: UserSummary,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenBundle> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    // Initial session record creation
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        hashedRefreshToken: 'pending',
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    const refreshToken = this.generateRefreshToken(session.id);
    const hashedRefreshToken = this.hashToken(refreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { hashedRefreshToken },
    });

    const accessToken = this.generateAccessToken(user, session.id);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }
}
