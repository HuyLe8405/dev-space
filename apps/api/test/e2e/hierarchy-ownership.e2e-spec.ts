import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Hierarchy Ownership & Anti-Enumeration (e2e)', () => {
  let app: INestApplication;

  const mockUsers = new Map<string, any>();
  const mockSessions = new Map<string, any>();
  const mockWorkspaces = new Map<string, any>();
  const mockAreas = new Map<string, any>();
  const mockProjects = new Map<string, any>();
  const mockNodes = new Map<string, any>();
  const mockRelationships = new Map<string, any>();

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
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockProjects.values()).filter(
          (p) => p.areaId === where.areaId,
        );
        return list.map((p) => ({
          ...JSON.parse(JSON.stringify(p)),
          _count: { nodes: 0 },
        }));
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
          return JSON.parse(JSON.stringify(node));
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockNodes.values()).filter(
          (n) => n.projectId === where.projectId,
        );
        return list.map((n) => JSON.parse(JSON.stringify(n)));
      }),
    },
    nodeRelationship: {
      create: jest.fn(async ({ data }) => {
        const id = 'rel-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const rel = {
          id,
          projectId: data.projectId,
          sourceNodeId: data.sourceNodeId,
          targetNodeId: data.targetNodeId,
          type: data.type || 'RELATES_TO',
          label: data.label || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockRelationships.set(id, rel);
        return JSON.parse(JSON.stringify(rel));
      }),
      findFirst: jest.fn(async ({ where }) => {
        if (where.id) {
          const rel = mockRelationships.get(where.id);
          if (!rel) return null;
          if (where.projectId && rel.projectId !== where.projectId) return null;
          return JSON.parse(JSON.stringify(rel));
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockRelationships.values()).filter(
          (r) => r.projectId === where.projectId,
        );
        return list.map((r) => JSON.parse(JSON.stringify(r)));
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

  it('should enforce complete 5-tier ownership hierarchy and uniform 404 responses', async () => {
    mockUsers.clear();
    mockSessions.clear();
    mockWorkspaces.clear();
    mockAreas.clear();
    mockProjects.clear();
    mockNodes.clear();
    mockRelationships.clear();

    // Register User 1
    const regRes1 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@devspace.io',
        password: 'Password123!',
        displayName: 'Alice',
      })
      .expect(201);
    const cookies1 = regRes1.headers['set-cookie'];
    const aliceCookie = cookies1 ? (Array.isArray(cookies1) ? cookies1[0] : cookies1) : '';

    // Register User 2 (Bob / unauthorized cross-tenant)
    const regRes2 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'bob@devspace.io',
        password: 'Password123!',
        displayName: 'Bob',
      })
      .expect(201);
    const cookies2 = regRes2.headers['set-cookie'];
    const bobCookie = cookies2 ? (Array.isArray(cookies2) ? cookies2[0] : cookies2) : '';

    // Alice creates Workspace 1, Area 1, Project 1, Node 1, Node 2, Relationship 1
    const ws1Res = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', aliceCookie)
      .send({ name: 'Alice WS' })
      .expect(201);
    const ws1Id = ws1Res.body.id;

    const area1Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas`)
      .set('Cookie', aliceCookie)
      .send({ name: 'Alice Area' })
      .expect(201);
    const area1Id = area1Res.body.id;

    const proj1Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects`)
      .set('Cookie', aliceCookie)
      .send({ name: 'Alice Project' })
      .expect(201);
    const proj1Id = proj1Res.body.id;

    const node1Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/nodes`)
      .set('Cookie', aliceCookie)
      .send({ name: 'Alice Node 1', nodeType: 'service' })
      .expect(201);
    const node1Id = node1Res.body.id;

    const node2Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/nodes`)
      .set('Cookie', aliceCookie)
      .send({ name: 'Alice Node 2', nodeType: 'database' })
      .expect(201);
    const node2Id = node2Res.body.id;

    const rel1Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/relationships`)
      .set('Cookie', aliceCookie)
      .send({
        sourceNodeId: node1Id,
        targetNodeId: node2Id,
        type: 'depends_on',
      })
      .expect(201);
    const rel1Id = rel1Res.body.id;

    // Bob creates his own Workspace 2 and Area 2
    const ws2Res = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', bobCookie)
      .send({ name: 'Bob WS' })
      .expect(201);
    const ws2Id = ws2Res.body.id;

    const area2Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${ws2Id}/areas`)
      .set('Cookie', bobCookie)
      .send({ name: 'Bob Area' })
      .expect(201);
    const area2Id = area2Res.body.id;

    // 1. Bob attempts to access Alice's Project -> 404 (anti-enumeration)
    await request(app.getHttpServer())
      .get(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}`)
      .set('Cookie', bobCookie)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}`)
      .set('Cookie', bobCookie)
      .send({ name: 'Hacked Project' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}`)
      .set('Cookie', bobCookie)
      .expect(404);

    // 2. Bob attempts to create a project in Alice's Area -> 404
    await request(app.getHttpServer())
      .post(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects`)
      .set('Cookie', bobCookie)
      .send({ name: 'Intruder Project' })
      .expect(404);

    // 3. Bob attempts to access Alice's Node -> 404
    await request(app.getHttpServer())
      .get(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/nodes/${node1Id}`)
      .set('Cookie', bobCookie)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/nodes/${node1Id}`)
      .set('Cookie', bobCookie)
      .send({ name: 'Hacked Node' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/nodes/${node1Id}`)
      .set('Cookie', bobCookie)
      .expect(404);

    // 4. Bob attempts to access Alice's Relationship -> 404
    await request(app.getHttpServer())
      .delete(`/api/workspaces/${ws1Id}/areas/${area1Id}/projects/${proj1Id}/relationships/${rel1Id}`)
      .set('Cookie', bobCookie)
      .expect(404);

    // 5. Alice attempts mismatched hierarchy (Workspace 1 + Area 2 + Project 1) -> 404
    await request(app.getHttpServer())
      .get(`/api/workspaces/${ws1Id}/areas/${area2Id}/projects/${proj1Id}`)
      .set('Cookie', aliceCookie)
      .expect(404);
  });
});

