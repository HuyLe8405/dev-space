import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Areas - Update (e2e)', () => {
  let app: INestApplication;

  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();
  const mockWorkspaces = new Map<string, any>();
  const mockAreas = new Map<string, any>();

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(mockPrismaService) : Promise.all(cb))),
    user: {
      findUnique: jest.fn(async ({ where }) => {
        if (where.email) {
          const user = Array.from(mockUsers.values()).find(
            (u) => u.email === where.email,
          );
          return user ? { ...user, profile: user.profile ? { ...user.profile } : null } : null;
        }
        if (where.id) {
          const user = mockUsers.get(where.id);
          return user ? { ...user, profile: user.profile ? { ...user.profile } : null } : null;
        }
        return null;
      }),
      create: jest.fn(async ({ data }) => {
        const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(7);
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
    },
    profile: {
      update: jest.fn(),
    },
    session: {
      create: jest.fn(async ({ data }) => {
        const id = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(7);
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
    },
    workspace: {
      create: jest.fn(async ({ data }) => {
        const id = 'ws-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const ws = {
          id,
          userId: data.userId,
          name: data.name,
          description: data.description || null,
          icon: data.icon || 'Briefcase',
          color: data.color || 'blue',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockWorkspaces.set(id, ws);
        return JSON.parse(JSON.stringify(ws));
      }),
      findFirst: jest.fn(async ({ where }) => {
        const ws = mockWorkspaces.get(where.id);
        if (!ws) return null;
        if (where.userId && ws.userId !== where.userId) return null;
        return JSON.parse(JSON.stringify(ws));
      }),
    },
    area: {
      create: jest.fn(async ({ data }) => {
        const id = 'area-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const area = {
          id,
          workspaceId: data.workspaceId,
          name: data.name,
          description: data.description || null,
          icon: data.icon || 'Layers',
          color: data.color || 'indigo',
          order: data.order ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockAreas.set(id, area);
        return JSON.parse(JSON.stringify(area));
      }),
      findFirst: jest.fn(async ({ where }) => {
        let matching = Array.from(mockAreas.values()).filter(
          (a) => a.workspaceId === where.workspaceId,
        );

        if (where.id?.not) {
          matching = matching.filter((a) => a.id !== where.id.not);
        } else if (where.id) {
          matching = matching.filter((a) => a.id === where.id);
        }

        if (where.name?.equals) {
          const target = where.name.equals.toLowerCase();
          matching = matching.filter(
            (a) => a.name.toLowerCase() === target,
          );
        }

        return matching.length > 0 ? JSON.parse(JSON.stringify(matching[0])) : null;
      }),
      update: jest.fn(async ({ where, data }) => {
        const area = mockAreas.get(where.id);
        if (!area) return null;
        if (data.name !== undefined) area.name = data.name;
        if (data.description !== undefined) area.description = data.description;
        if (data.icon !== undefined) area.icon = data.icon;
        if (data.color !== undefined) area.color = data.color;
        area.updatedAt = new Date();
        return JSON.parse(JSON.stringify(area));
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let authCookies: string[];
  let workspaceId: string;
  let areaAId: string;
  let areaBId: string;

  it('Setup: Register User, Create Workspace, and Two Areas', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'update-tester@example.com', password: 'Password123!', displayName: 'Update Tester' });
    authCookies = regRes.headers['set-cookie'] as unknown as string[];

    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', authCookies)
      .send({ name: 'Update Workspace' });
    workspaceId = wsRes.body.id;

    const a1 = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', authCookies)
      .send({ name: 'Architecture' });
    areaAId = a1.body.id;

    const a2 = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', authCookies)
      .send({ name: 'DevOps' });
    areaBId = a2.body.id;
  });

  it('PATCH /:areaId - updates area attributes and preserves unmodified fields', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspaceId}/areas/${areaAId}`)
      .set('Cookie', authCookies)
      .send({
        name: 'Core Architecture',
        color: 'cyan',
      })
      .expect(200);

    expect(res.body.name).toBe('Core Architecture');
    expect(res.body.color).toBe('cyan');
    expect(res.body.icon).toBe('Layers'); // preserved
  });

  it('PATCH /:areaId - rejects conflict when renaming to sibling area name', async () => {
    await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspaceId}/areas/${areaAId}`)
      .set('Cookie', authCookies)
      .send({
        name: 'devops', // clashes with sibling areaB
      })
      .expect(409);
  });

  it('PATCH /:areaId - allows updating with same name (no self-conflict)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspaceId}/areas/${areaAId}`)
      .set('Cookie', authCookies)
      .send({
        name: 'Core Architecture',
        description: 'Updated system architecture',
      })
      .expect(200);
  });
});
