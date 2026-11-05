import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Projects (e2e)', () => {
  let app: INestApplication;

  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();
  const mockWorkspaces = new Map<string, any>();
  const mockAreas = new Map<string, any>();
  const mockProjects = new Map<string, any>();
  const mockNodes = new Map<string, any>();

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
        const area = mockAreas.get(where.id);
        if (!area) return null;
        if (where.workspaceId && area.workspaceId !== where.workspaceId) return null;
        if (where.workspace?.userId) {
          const ws = mockWorkspaces.get(area.workspaceId);
          if (!ws || ws.userId !== where.workspace?.userId) return null;
        }
        return JSON.parse(JSON.stringify(area));
      }),
    },
    project: {
      create: jest.fn(async ({ data }) => {
        const id = 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const project = {
          id,
          areaId: data.areaId,
          name: data.name,
          description: data.description || null,
          icon: data.icon || 'Folder',
          color: data.color || 'cyan',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockProjects.set(id, project);
        return JSON.parse(JSON.stringify(project));
      }),
      findFirst: jest.fn(async ({ where }) => {
        if (where.id) {
          const project = mockProjects.get(where.id);
          if (!project) return null;
          if (where.areaId && project.areaId !== where.areaId) return null;
          if (where.NOT?.id && project.id === where.NOT.id) return null;
          return {
            ...JSON.parse(JSON.stringify(project)),
            _count: { nodes: 0 },
          };
        }
        if (where.areaId && where.name) {
          const match = Array.from(mockProjects.values()).find(
            (p) =>
              p.areaId === where.areaId &&
              p.name.toLowerCase() === where.name.equals.toLowerCase() &&
              (!where.NOT?.id || p.id !== where.NOT.id),
          );
          return match
            ? {
                ...JSON.parse(JSON.stringify(match)),
                _count: { nodes: 0 },
              }
            : null;
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockProjects.values()).filter(
          (p) => p.areaId === where.areaId,
        );
        return list.map((p) => ({
          ...JSON.parse(JSON.stringify(p)),
          _count: { nodes: 0 },
        }));
      }),
      update: jest.fn(async ({ where, data }) => {
        const project = mockProjects.get(where.id);
        if (!project) return null;
        if (data.name) project.name = data.name;
        if (data.description !== undefined) project.description = data.description;
        if (data.icon) project.icon = data.icon;
        if (data.color) project.color = data.color;
        project.updatedAt = new Date();
        return {
          ...JSON.parse(JSON.stringify(project)),
          _count: { nodes: 0 },
        };
      }),
      delete: jest.fn(async ({ where }) => {
        const project = mockProjects.get(where.id);
        if (project) {
          mockProjects.delete(where.id);
        }
        return project;
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
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let userCookie: string;
  let workspaceId: string;
  let areaId: string;

  beforeEach(async () => {
    mockUsers.clear();
    mockSessions.clear();
    mockWorkspaces.clear();
    mockAreas.clear();
    mockProjects.clear();
    mockNodes.clear();

    // Register User
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'dev@example.com',
        password: 'Password123!',
        displayName: 'DevSpace User',
      })
      .expect(201);

    const cookies = regRes.headers['set-cookie'];
    userCookie = cookies ? (Array.isArray(cookies) ? cookies[0] : cookies) : '';

    // Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', userCookie)
      .send({ name: 'Engineering Workspace' })
      .expect(201);
    workspaceId = wsRes.body.id;

    // Create Area
    const areaRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', userCookie)
      .send({ name: 'Backend Domain' })
      .expect(201);
    areaId = areaRes.body.id;
  });

  it('should successfully create, read, update and delete a project', async () => {
    // 1. Create Project
    const createRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects`)
      .set('Cookie', userCookie)
      .send({
        name: 'DevSpace Core API',
        description: 'Core NestJS backend',
        icon: 'Boxes',
        color: 'cyan',
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.name).toBe('DevSpace Core API');
    expect(createRes.body.icon).toBe('Boxes');
    expect(createRes.body.color).toBe('cyan');
    expect(createRes.body.nodeCount).toBe(0);
    const projectId = createRes.body.id;

    // 2. Reject duplicate project name in same area
    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects`)
      .set('Cookie', userCookie)
      .send({ name: 'devspace core api' })
      .expect(409);

    // 3. List projects
    const listRes = await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceId}/areas/${areaId}/projects`)
      .set('Cookie', userCookie)
      .expect(200);

    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].id).toBe(projectId);

    // 4. Get project details
    const getRes = await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}`)
      .set('Cookie', userCookie)
      .expect(200);

    expect(getRes.body.id).toBe(projectId);
    expect(getRes.body.name).toBe('DevSpace Core API');

    // 5. Update project
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}`)
      .set('Cookie', userCookie)
      .send({ name: 'DevSpace API v2', color: 'indigo' })
      .expect(200);

    expect(updateRes.body.name).toBe('DevSpace API v2');
    expect(updateRes.body.color).toBe('indigo');

    // 6. Delete project
    await request(app.getHttpServer())
      .delete(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}`)
      .set('Cookie', userCookie)
      .expect(204);

    // 7. Verify 404 after deletion
    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}`)
      .set('Cookie', userCookie)
      .expect(404);
  });

  it('should return 404 if area does not belong to user workspace', async () => {
    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/foreign-area/projects`)
      .set('Cookie', userCookie)
      .send({ name: 'DevSpace Test' })
      .expect(404);
  });
});

