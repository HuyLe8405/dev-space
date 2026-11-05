import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Nodes (e2e)', () => {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockProjects.set(id, project);
        return JSON.parse(JSON.stringify(project));
      }),
      findFirst: jest.fn(async ({ where }) => {
        const project = mockProjects.get(where.id);
        if (!project) return null;
        if (where.areaId && project.areaId !== where.areaId) return null;
        if (where.area?.workspaceId) {
          const area = mockAreas.get(project.areaId);
          if (!area || area.workspaceId !== where.area?.workspaceId) return null;
        }
        if (where.area?.workspace?.userId) {
          const area = mockAreas.get(project.areaId);
          const ws = area ? mockWorkspaces.get(area.workspaceId) : null;
          if (!ws || ws.userId !== where.area?.workspace?.userId) return null;
        }
        return JSON.parse(JSON.stringify(project));
      }),
    },
    node: {
      create: jest.fn(async ({ data }) => {
        const id = 'node-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const node = {
          id,
          projectId: data.projectId,
          name: data.name,
          description: data.description || null,
          nodeType: data.nodeType || 'CONCEPT',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockNodes.set(id, node);
        return JSON.parse(JSON.stringify(node));
      }),
      findFirst: jest.fn(async ({ where }) => {
        if (where.id) {
          const node = mockNodes.get(where.id);
          if (!node) return null;
          if (where.projectId && node.projectId !== where.projectId) return null;
          if (where.NOT?.id && node.id === where.NOT.id) return null;
          return JSON.parse(JSON.stringify(node));
        }
        if (where.projectId && where.name) {
          const match = Array.from(mockNodes.values()).find(
            (n) =>
              n.projectId === where.projectId &&
              n.name.toLowerCase() === where.name.equals.toLowerCase() &&
              (!where.NOT?.id || n.id !== where.NOT.id),
          );
          return match ? JSON.parse(JSON.stringify(match)) : null;
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockNodes.values()).filter(
          (n) => n.projectId === where.projectId,
        );
        return list.map((n) => JSON.parse(JSON.stringify(n)));
      }),
      update: jest.fn(async ({ where, data }) => {
        const node = mockNodes.get(where.id);
        if (!node) return null;
        if (data.name) node.name = data.name;
        if (data.description !== undefined) node.description = data.description;
        if (data.nodeType) node.nodeType = data.nodeType;
        node.updatedAt = new Date();
        return JSON.parse(JSON.stringify(node));
      }),
      delete: jest.fn(async ({ where }) => {
        const node = mockNodes.get(where.id);
        if (node) {
          mockNodes.delete(where.id);
        }
        return node;
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
  let projectId: string;

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
        email: 'dev2@example.com',
        password: 'Password123!',
        displayName: 'DevSpace User 2',
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

    // Create Project
    const projRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects`)
      .set('Cookie', userCookie)
      .send({ name: 'DevSpace API' })
      .expect(201);
    projectId = projRes.body.id;
  });

  it('should successfully create, read, update and delete a node', async () => {
    // 1. Create Node
    const createRes = await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes`,
      )
      .set('Cookie', userCookie)
      .send({
        name: 'Auth Module',
        description: 'Authentication subsystem',
        nodeType: 'module',
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.name).toBe('Auth Module');
    expect(createRes.body.nodeType).toBe('module');
    const nodeId = createRes.body.id;

    // 2. Reject duplicate node name in same project
    await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes`,
      )
      .set('Cookie', userCookie)
      .send({ name: 'auth module' })
      .expect(409);

    // 3. List nodes
    const listRes = await request(app.getHttpServer())
      .get(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes`,
      )
      .set('Cookie', userCookie)
      .expect(200);

    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].id).toBe(nodeId);

    // 4. Get node details
    const getRes = await request(app.getHttpServer())
      .get(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes/${nodeId}`,
      )
      .set('Cookie', userCookie)
      .expect(200);

    expect(getRes.body.id).toBe(nodeId);
    expect(getRes.body.name).toBe('Auth Module');

    // 5. Update node
    const updateRes = await request(app.getHttpServer())
      .patch(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes/${nodeId}`,
      )
      .set('Cookie', userCookie)
      .send({ name: 'Auth Service', nodeType: 'service' })
      .expect(200);

    expect(updateRes.body.name).toBe('Auth Service');
    expect(updateRes.body.nodeType).toBe('service');

    // 6. Delete node
    await request(app.getHttpServer())
      .delete(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes/${nodeId}`,
      )
      .set('Cookie', userCookie)
      .expect(204);

    // 7. Verify 404 after deletion
    await request(app.getHttpServer())
      .get(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes/${nodeId}`,
      )
      .set('Cookie', userCookie)
      .expect(404);
  });

  it('should return 404 if project does not belong to user hierarchy', async () => {
    await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceId}/areas/${areaId}/projects/foreign-proj/nodes`,
      )
      .set('Cookie', userCookie)
      .send({ name: 'Test Node' })
      .expect(404);
  });
});

