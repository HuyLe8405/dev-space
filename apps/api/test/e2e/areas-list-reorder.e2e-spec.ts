import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Areas - List & Reorder (e2e)', () => {
  let app: INestApplication;

  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();
  const mockWorkspaces = new Map<string, any>();
  const mockAreas = new Map<string, any>();

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (actions) => {
      if (Array.isArray(actions)) {
        return Promise.all(actions);
      }
      return actions(mockPrismaService);
    }),
    user: {
      findUnique: jest.fn(async ({ where }) => {
        if (where.email) {
          const user = Array.from(mockUsers.values()).find(
            (u) => u.email === where.email,
          );
          return user
            ? { ...user, profile: user.profile ? { ...user.profile } : null }
            : null;
        }
        if (where.id) {
          const user = mockUsers.get(where.id);
          return user
            ? { ...user, profile: user.profile ? { ...user.profile } : null }
            : null;
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
      findFirst: jest.fn(async ({ where, orderBy }) => {
        let matching = Array.from(mockAreas.values()).filter(
          (a) => a.workspaceId === where.workspaceId,
        );

        if (where.name?.equals) {
          const target = where.name.equals.toLowerCase();
          matching = matching.filter(
            (a) => a.name.toLowerCase() === target,
          );
        }

        if (where.id) {
          matching = matching.filter((a) => a.id === where.id);
        }

        if (orderBy?.order === 'desc') {
          matching.sort((a, b) => b.order - a.order);
        }

        return matching.length > 0 ? JSON.parse(JSON.stringify(matching[0])) : null;
      }),
      findMany: jest.fn(async ({ where, orderBy, select }) => {
        let matching = Array.from(mockAreas.values()).filter(
          (a) => a.workspaceId === where.workspaceId,
        );

        if (orderBy?.order === 'asc') {
          matching.sort((a, b) => a.order - b.order);
        }

        if (select?.id) {
          return matching.map((a) => ({ id: a.id }));
        }

        return JSON.parse(JSON.stringify(matching));
      }),
      update: jest.fn(async ({ where, data }) => {
        const area = mockAreas.get(where.id);
        if (area) {
          if (data.order !== undefined) area.order = data.order;
          area.updatedAt = new Date();
        }
        return area ? JSON.parse(JSON.stringify(area)) : null;
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
  let areaCId: string;

  it('Setup: Register User, Create Workspace, and 3 Areas', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'list-reorder-tester@example.com',
        password: 'Password123!',
        displayName: 'List Reorder Tester',
      })
      .expect(201);

    authCookies = regRes.headers['set-cookie'] as unknown as string[];

    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', authCookies)
      .send({ name: 'Development HQ' })
      .expect(201);

    workspaceId = wsRes.body.id;

    // Create 3 areas
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

    const a3 = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', authCookies)
      .send({ name: 'QA' });
    areaCId = a3.body.id;
  });

  it('GET /api/workspaces/:workspaceId/areas - returns all areas in sequential order', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', authCookies)
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0].id).toBe(areaAId);
    expect(res.body.items[0].order).toBe(0);
    expect(res.body.items[1].id).toBe(areaBId);
    expect(res.body.items[1].order).toBe(1);
    expect(res.body.items[2].id).toBe(areaCId);
    expect(res.body.items[2].order).toBe(2);
  });

  it('PUT /api/workspaces/:workspaceId/areas/reorder - atomically updates tab order', async () => {
    // Reorder from [A, B, C] to [C, A, B]
    const res = await request(app.getHttpServer())
      .put(`/api/workspaces/${workspaceId}/areas/reorder`)
      .set('Cookie', authCookies)
      .send({
        areaIds: [areaCId, areaAId, areaBId],
      })
      .expect(200);

    expect(res.body.items[0].id).toBe(areaCId);
    expect(res.body.items[0].order).toBe(0);
    expect(res.body.items[1].id).toBe(areaAId);
    expect(res.body.items[1].order).toBe(1);
    expect(res.body.items[2].id).toBe(areaBId);
    expect(res.body.items[2].order).toBe(2);
  });

  it('PUT /api/workspaces/:workspaceId/areas/reorder - rejects missing/incomplete ID list with 400', async () => {
    await request(app.getHttpServer())
      .put(`/api/workspaces/${workspaceId}/areas/reorder`)
      .set('Cookie', authCookies)
      .send({
        areaIds: [areaCId, areaAId], // Missing areaBId
      })
      .expect(400);
  });

  it('PUT /api/workspaces/:workspaceId/areas/reorder - rejects foreign area ID with 400', async () => {
    await request(app.getHttpServer())
      .put(`/api/workspaces/${workspaceId}/areas/reorder`)
      .set('Cookie', authCookies)
      .send({
        areaIds: [areaCId, areaAId, 'foreign-area-999'],
      })
      .expect(400);
  });
});
