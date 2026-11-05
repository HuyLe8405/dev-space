import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Data Cascade Integrity (e2e)', () => {
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
      delete: jest.fn(async ({ where }) => {
        const area = mockAreas.get(where.id);
        if (area) {
          mockAreas.delete(where.id);
          // Simulate database cascade: delete projects, nodes, and relationships in this area
          const projectsToDelete = Array.from(mockProjects.values()).filter(
            (p) => p.areaId === where.id,
          );
          for (const proj of projectsToDelete) {
            mockProjects.delete(proj.id);
            const nodesToDelete = Array.from(mockNodes.values()).filter(
              (n) => n.projectId === proj.id,
            );
            for (const n of nodesToDelete) {
              mockNodes.delete(n.id);
            }
            const relsToDelete = Array.from(mockRelationships.values()).filter(
              (r) => r.projectId === proj.id,
            );
            for (const r of relsToDelete) {
              mockRelationships.delete(r.id);
            }
          }
        }
        return area;
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
      delete: jest.fn(async ({ where }) => {
        const node = mockNodes.get(where.id);
        if (node) {
          mockNodes.delete(where.id);
          // Simulate database cascade: delete relationships where source or target is this node
          const relsToDelete = Array.from(mockRelationships.values()).filter(
            (r) => r.sourceNodeId === where.id || r.targetNodeId === where.id,
          );
          for (const r of relsToDelete) {
            mockRelationships.delete(r.id);
          }
        }
        return node;
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

  it('should cascade delete relationships when a connected node is deleted', async () => {
    mockUsers.clear();
    mockSessions.clear();
    mockWorkspaces.clear();
    mockAreas.clear();
    mockProjects.clear();
    mockNodes.clear();
    mockRelationships.clear();

    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'cascade@devspace.io',
        password: 'Password123!',
        displayName: 'Cascade Tester',
      })
      .expect(201);
    const cookies = regRes.headers['set-cookie'];
    const cookie = cookies ? (Array.isArray(cookies) ? cookies[0] : cookies) : '';

    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', cookie)
      .send({ name: 'Cascade WS' })
      .expect(201);
    const wsId = wsRes.body.id;

    const areaRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${wsId}/areas`)
      .set('Cookie', cookie)
      .send({ name: 'Cascade Area' })
      .expect(201);
    const areaId = areaRes.body.id;

    const projRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${wsId}/areas/${areaId}/projects`)
      .set('Cookie', cookie)
      .send({ name: 'Cascade Project' })
      .expect(201);
    const projId = projRes.body.id;

    // Create 2 nodes
    const n1 = await request(app.getHttpServer())
      .post(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/nodes`)
      .set('Cookie', cookie)
      .send({ name: 'Node 1', nodeType: 'concept' })
      .expect(201);

    const n2 = await request(app.getHttpServer())
      .post(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/nodes`)
      .set('Cookie', cookie)
      .send({ name: 'Node 2', nodeType: 'database' })
      .expect(201);

    // Create relationship
    await request(app.getHttpServer())
      .post(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/relationships`)
      .set('Cookie', cookie)
      .send({
        sourceNodeId: n1.body.id,
        targetNodeId: n2.body.id,
        type: 'depends_on',
      })
      .expect(201);

    // Verify 1 relationship exists
    const relsBefore = await request(app.getHttpServer())
      .get(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/relationships`)
      .set('Cookie', cookie)
      .expect(200);
    expect(relsBefore.body.total).toBe(1);

    // Delete Node 1
    await request(app.getHttpServer())
      .delete(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/nodes/${n1.body.id}`)
      .set('Cookie', cookie)
      .expect(204);

    // Verify relationship was deleted by cascade
    const relsAfter = await request(app.getHttpServer())
      .get(`/api/workspaces/${wsId}/areas/${areaId}/projects/${projId}/relationships`)
      .set('Cookie', cookie)
      .expect(200);
    expect(relsAfter.body.total).toBe(0);
  });
});

