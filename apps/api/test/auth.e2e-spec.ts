import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Auth & User Management (e2e)', () => {
  let app: INestApplication;
  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
    user: {
      findUnique: jest.fn(async ({ where }) => {
        if (where.email) {
          const user = Array.from(mockUsers.values()).find((u) => u.email === where.email);
          return user ? { ...user, profile: user.profile ? { ...user.profile } : null } : null;
        }
        if (where.id) {
          const user = mockUsers.get(where.id);
          return user ? { ...user, profile: user.profile ? { ...user.profile } : null } : null;
        }
        return null;
      }),
      create: jest.fn(async ({ data }) => {
        const id = 'user-' + Date.now();
        const user = {
          id,
          email: data.email,
          passwordHash: data.passwordHash,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          profile: {
            id: 'profile-' + id,
            userId: id,
            displayName: data.profile.create.displayName,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        mockUsers.set(id, user);
        return { ...user, profile: { ...user.profile } };
      }),
      update: jest.fn(async ({ where, data }) => {
        const user = mockUsers.get(where.id);
        if (user) {
          if (data.passwordHash) user.passwordHash = data.passwordHash;
          user.updatedAt = new Date();
        }
        return user ? JSON.parse(JSON.stringify(user)) : null;
      }),
    },
    profile: {
      update: jest.fn(async ({ where, data }) => {
        const user = Array.from(mockUsers.values()).find((u) => u.id === where.userId);
        if (user) {
          user.profile.displayName = data.displayName;
          user.profile.updatedAt = new Date();
          return {
            id: user.profile.id,
            userId: user.id,
            displayName: user.profile.displayName,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
            user,
          };
        }
        return null;
      }),
    },
    session: {
      create: jest.fn(async ({ data }) => {
        const id = 'session-' + Date.now();
        const session = {
          id,
          userId: data.userId,
          hashedRefreshToken: data.hashedRefreshToken,
          expiresAt: data.expiresAt,
          isRevoked: false,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockSessions.set(id, session);
        return JSON.parse(JSON.stringify(session));
      }),
      findUnique: jest.fn(async ({ where }) => {
        const session = mockSessions.get(where.id);
        if (!session) return null;
        const user = mockUsers.get(session.userId);
        return {
          ...session,
          expiresAt: new Date(session.expiresAt),
          user: user
            ? {
                ...user,
                createdAt: new Date(user.createdAt),
                profile: user.profile ? { ...user.profile } : null,
              }
            : null,
        };
      }),
      update: jest.fn(async ({ where, data }) => {
        const session = mockSessions.get(where.id);
        if (session) {
          if (data.hashedRefreshToken) session.hashedRefreshToken = data.hashedRefreshToken;
          if (data.expiresAt) session.expiresAt = data.expiresAt;
          if (data.isRevoked !== undefined) session.isRevoked = data.isRevoked;
          session.updatedAt = new Date();
        }
        return session ? JSON.parse(JSON.stringify(session)) : null;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        let count = 0;
        for (const [id, session] of mockSessions.entries()) {
          if (session.userId === where.userId && (!where.id || session.id !== where.id.not)) {
            session.isRevoked = data.isRevoked;
            count++;
          }
        }
        return { count };
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let authCookies: string[];

  it('POST /api/auth/register - Scenario 1: Successful Registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alex@example.com',
        password: 'Password123',
        displayName: 'Alex Rivera',
      })
      .expect(201);

    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('alex@example.com');
    expect(response.body.user.displayName).toBe('Alex Rivera');
    expect(response.headers['set-cookie']).toBeDefined();

    authCookies = response.headers['set-cookie'];
  });

  it('POST /api/auth/register - Scenario 2: Duplicate email rejects without confirmation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alex@example.com',
        password: 'Password123',
      })
      .expect(400);

    expect(response.body.message).toContain('Registration cannot be completed with this email');
  });

  it('GET /api/auth/me - Scenario 3: Verify authenticated session', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', authCookies)
      .expect(200);

    expect(response.body.email).toBe('alex@example.com');
    expect(response.body.displayName).toBe('Alex Rivera');
  });

  it('PATCH /api/users/profile - Scenario 4: Update display name', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/users/profile')
      .set('Cookie', authCookies)
      .send({ displayName: 'Alexander The Great' })
      .expect(200);

    expect(response.body.displayName).toBe('Alexander The Great');
  });

  it('POST /api/auth/refresh - Scenario 5: Silent token rotation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', authCookies)
      .expect(200);

    expect(response.body.expiresIn).toBe(900);
    expect(response.headers['set-cookie']).toBeDefined();
    authCookies = response.headers['set-cookie'];
  });

  it('POST /api/users/change-password - Scenario 6: Password change keeping session active', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users/change-password')
      .set('Cookie', authCookies)
      .send({
        currentPassword: 'Password123',
        newPassword: 'NewPassword456',
      })
      .expect(200);

    expect(response.body.message).toContain('Password changed successfully');
    expect(response.headers['set-cookie']).toBeDefined();
    authCookies = response.headers['set-cookie'];
  });

  it('POST /api/auth/logout - Scenario 7: Sign-out and cookie clearing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', authCookies)
      .expect(200);

    expect(response.body.message).toContain('Logged out successfully');

    // Confirm that subsequent request with cleared session is rejected
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });
});
