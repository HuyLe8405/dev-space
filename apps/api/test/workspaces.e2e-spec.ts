import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Workspaces Management (e2e)', () => {
  let app: INestApplication;

  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();
  const mockWorkspaces = new Map<string, any>();

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
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
          if (data.hashedRefreshToken)
            session.hashedRefreshToken = data.hashedRefreshToken;
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
      findMany: jest.fn(async ({ where, orderBy }) => {
        const list = Array.from(mockWorkspaces.values()).filter(
          (w) => w.userId === where.userId,
        );
        if (orderBy?.createdAt === 'desc') {
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }
        return JSON.parse(JSON.stringify(list));
      }),
      findFirst: jest.fn(async ({ where }) => {
        const ws = mockWorkspaces.get(where.id);
        if (!ws) return null;
        if (where.userId && ws.userId !== where.userId) return null;
        return JSON.parse(JSON.stringify(ws));
      }),
      update: jest.fn(async ({ where, data }) => {
        const ws = mockWorkspaces.get(where.id);
        if (!ws) return null;
        if (data.name !== undefined) ws.name = data.name;
        if (data.description !== undefined) ws.description = data.description;
        if (data.icon !== undefined) ws.icon = data.icon;
        if (data.color !== undefined) ws.color = data.color;
        ws.updatedAt = new Date();
        return JSON.parse(JSON.stringify(ws));
      }),
      delete: jest.fn(async ({ where }) => {
        const ws = mockWorkspaces.get(where.id);
        if (ws) {
          mockWorkspaces.delete(where.id);
          return ws;
        }
        return null;
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

  let userACookies: string[];
  let userBCookies: string[];
  let workspaceAId: string;

  it('Setup: Register User A and User B', async () => {
    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'usera@example.com',
        password: 'Password123!',
        displayName: 'User A',
      })
      .expect(201);

    userACookies = resA.headers['set-cookie'] as unknown as string[];

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'userb@example.com',
        password: 'Password123!',
        displayName: 'User B',
      })
      .expect(201);

    userBCookies = resB.headers['set-cookie'] as unknown as string[];
  });

  describe('US1: Create Workspace (POST /api/workspaces)', () => {
    it('should create workspace with name and default presets', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Cookie', userACookies)
        .send({ name: '  Engineering Space  ' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Engineering Space');
      expect(res.body.icon).toBe('Briefcase');
      expect(res.body.color).toBe('blue');
      workspaceAId = res.body.id;
    });

    it('should create workspace with custom presets and description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Cookie', userACookies)
        .send({
          name: 'Learning Java',
          description: 'Core backend concepts',
          icon: 'Code',
          color: 'emerald',
        })
        .expect(201);

      expect(res.body.name).toBe('Learning Java');
      expect(res.body.description).toBe('Core backend concepts');
      expect(res.body.icon).toBe('Code');
      expect(res.body.color).toBe('emerald');
    });

    it('should reject creation with empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Cookie', userACookies)
        .send({ name: '   ' })
        .expect(400);
    });

    it('should reject creation with invalid icon or color preset', async () => {
      await request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Cookie', userACookies)
        .send({
          name: 'Invalid Presets',
          icon: 'NotAnIcon',
          color: 'hotpink',
        })
        .expect(400);
    });
  });

  describe('US2: List Workspaces (GET /api/workspaces)', () => {
    it('should list all workspaces belonging to authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/workspaces')
        .set('Cookie', userACookies)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].name).toBe('Learning Java');
    });

    it('should return empty list for user with zero workspaces', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/workspaces')
        .set('Cookie', userBCookies)
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('US5: Ownership Isolation & Access Protection', () => {
    it('should allow User A to retrieve their own workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userACookies)
        .expect(200);

      expect(res.body.id).toBe(workspaceAId);
      expect(res.body.name).toBe('Engineering Space');
    });

    it('should return uniform 404 when User B attempts to access User A workspace', async () => {
      await request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });

    it('should return 404 for completely non-existent workspace ID', async () => {
      await request(app.getHttpServer())
        .get('/api/workspaces/ws-non-existent')
        .set('Cookie', userACookies)
        .expect(404);
    });

    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/workspaces')
        .expect(401);
    });
  });

  describe('US3: Edit Workspace Information (PATCH /api/workspaces/:id)', () => {
    it('should update workspace fields while preserving unmodified attributes', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userACookies)
        .send({
          name: 'Engineering Master',
          color: 'purple',
        })
        .expect(200);

      expect(res.body.name).toBe('Engineering Master');
      expect(res.body.color).toBe('purple');
      // Unmodified icon remains Briefcase
      expect(res.body.icon).toBe('Briefcase');
    });

    it('should return 404 when User B attempts to update User A workspace', async () => {
      await request(app.getHttpServer())
        .patch(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userBCookies)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('US4: Delete Workspace (DELETE /api/workspaces/:id)', () => {
    it('should return 404 when User B attempts to delete User A workspace', async () => {
      await request(app.getHttpServer())
        .delete(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });

    it('should allow User A to delete their own workspace', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userACookies)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify workspace is no longer found
      await request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceAId}`)
        .set('Cookie', userACookies)
        .expect(404);
    });
  });
});
