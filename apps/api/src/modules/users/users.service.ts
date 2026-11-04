import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { UserSummary, UserProfile } from '@devspace/contracts';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async createUser(email: string, passwordHash: string, displayName?: string): Promise<UserSummary> {
    const normalizedEmail = email.trim().toLowerCase();

    // Display name defaults to local-part of email per FR-001 / Q3 clarification
    const fallbackName = normalizedEmail.split('@')[0] || 'user';
    const resolvedDisplayName =
      displayName && displayName.trim().length > 0 ? displayName.trim() : fallbackName;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          profile: {
            create: {
              displayName: resolvedDisplayName,
            },
          },
        },
        include: { profile: true },
      });

      return user;
    });

    return {
      id: result.id,
      email: result.email,
      displayName: result.profile?.displayName || fallbackName,
      createdAt:
        result.createdAt instanceof Date
          ? result.createdAt.toISOString()
          : new Date(result.createdAt).toISOString(),
    };
  }

  async updateProfile(userId: string, displayName: string): Promise<UserProfile> {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 60) {
      throw new BadRequestException('Display name must be between 1 and 60 characters');
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { displayName: trimmed },
      include: { user: true },
    });

    return {
      id: updated.user.id,
      email: updated.user.email,
      displayName: updated.displayName,
      createdAt:
        updated.user.createdAt instanceof Date
          ? updated.user.createdAt.toISOString()
          : new Date(updated.user.createdAt).toISOString(),
      updatedAt:
        updated.updatedAt instanceof Date
          ? updated.updatedAt.toISOString()
          : new Date(updated.updatedAt).toISOString(),
    };
  }

  async updatePasswordHash(userId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
