import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Node Relationships (e2e)', () => {
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
          if (where.NOT?.id && rel.id === where.NOT.id) return null;
          return JSON.parse(JSON.stringify(rel));
        }
        if (where.projectId && where.sourceNodeId && where.targetNodeId && where.type) {
          const match = Array.from(mockRelationships.values()).find(
            (r) =>
              r.projectId === where.projectId &&
              r.sourceNodeId === where.sourceNodeId &&
              r.targetNodeId === where.targetNodeId &&
              r.type === where.type &&
              (!where.NOT?.id || r.id !== where.NOT.id),
          );
          return match ? JSON.parse(JSON.stringify(match)) : null;
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }) => {
        const list = Array.from(mockRelationships.values()).filter(
          (r) => r.projectId === where.projectId,
        );
        return list.map((r) => JSON.parse(JSON.stringify(r)));
      }),
      update: jest.fn(async ({ where, data }) => {
        const rel = mockRelationships.get(where.id);
        if (!rel) return null;
        if (data.type) rel.type = data.type;
        if (data.label !== undefined) rel.label = data.label;
        rel.updatedAt = new Date();
        return JSON.parse(JSON.stringify(rel));
      }),
      delete: jest.fn(async ({ where }) => {
        const rel = mockRelationships.get(where.id);
        if (rel) {
          mockRelationships.delete(where.id);
        }
        return rel;
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
  let otherUserCookie: string;
  let workspaceId: string;
  let areaId: string;
  let projectId: string;
  let node1Id: string;
  let node2Id: string;

  beforeEach(async () => {
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
        email: 'relowner@test.com',
        password: 'Password123!',
        displayName: 'Rel Owner',
      })
      .expect(201);
    const cookies1 = regRes1.headers['set-cookie'];
    userCookie = cookies1 ? (Array.isArray(cookies1) ? cookies1[0] : cookies1) : '';

    // Register User 2 (intruder)
    const regRes2 = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'relintruder@test.com',
        password: 'Password123!',
        displayName: 'Rel Intruder',
      })
      .expect(201);
    const cookies2 = regRes2.headers['set-cookie'];
    otherUserCookie = cookies2 ? (Array.isArray(cookies2) ? cookies2[0] : cookies2) : '';

    // Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Cookie', userCookie)
      .send({ name: 'Relationships WS' })
      .expect(201);
    workspaceId = wsRes.body.id;

    // Create Area
    const areaRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas`)
      .set('Cookie', userCookie)
      .send({ name: 'Rel Area' })
      .expect(201);
    areaId = areaRes.body.id;

    // Create Project
    const projRes = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects`)
      .set('Cookie', userCookie)
      .send({ name: 'Rel Project' })
      .expect(201);
    projectId = projRes.body.id;

    // Create 2 nodes
    const node1Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes`)
      .set('Cookie', userCookie)
      .send({ name: 'Source Node', nodeType: 'service' })
      .expect(201);
    node1Id = node1Res.body.id;

    const node2Res = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/nodes`)
      .set('Cookie', userCookie)
      .send({ name: 'Target Node', nodeType: 'database' })
      .expect(201);
    node2Id = node2Res.body.id;
  });

  it('should manage node relationships lifecycle correctly', async () => {
    const relUrl = `/api/workspaces/${workspaceId}/areas/${areaId}/projects/${projectId}/relationships`;

    // 1. Reject self-referencing relationship
    await request(app.getHttpServer())
      .post(relUrl)
      .set('Cookie', userCookie)
      .send({
        sourceNodeId: node1Id,
        targetNodeId: node1Id,
        type: 'relates_to',
      })
      .expect(400);

    // 2. Reject relationship with non-existent node
    await request(app.getHttpServer())
      .post(relUrl)
      .set('Cookie', userCookie)
      .send({
        sourceNodeId: node1Id,
        targetNodeId: 'node-nonexistent',
        type: 'relates_to',
      })
      .expect(404);

    // 3. Create relationship successfully
    const createRelRes = await request(app.getHttpServer())
      .post(relUrl)
      .set('Cookie', userCookie)
      .send({
        sourceNodeId: node1Id,
        targetNodeId: node2Id,
        type: 'depends_on',
        label: 'reads from db',
      })
      .expect(201);

    expect(createRelRes.body.sourceNodeId).toBe(node1Id);
    expect(createRelRes.body.targetNodeId).toBe(node2Id);
    expect(createRelRes.body.type).toBe('depends_on');
    expect(createRelRes.body.label).toBe('reads from db');
    const relId = createRelRes.body.id;

    // 4. Duplicate relationship rejected with 409 Conflict
    await request(app.getHttpServer())
      .post(relUrl)
      .set('Cookie', userCookie)
      .send({
        sourceNodeId: node1Id,
        targetNodeId: node2Id,
        type: 'depends_on',
      })
      .expect(409);

    // 5. List relationships
    const listRes = await request(app.getHttpServer())
      .get(relUrl)
      .set('Cookie', userCookie)
      .expect(200);

    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].id).toBe(relId);

    // 6. Update relationship
    const updateRes = await request(app.getHttpServer())
      .patch(`${relUrl}/${relId}`)
      .set('Cookie', userCookie)
      .send({
        type: 'contains',
        label: 'sub-service',
      })
      .expect(200);

    expect(updateRes.body.type).toBe('contains');
    expect(updateRes.body.label).toBe('sub-service');

    // 7. Unauthorized user cannot access or delete (returns 404)
    await request(app.getHttpServer())
      .delete(`${relUrl}/${relId}`)
      .set('Cookie', otherUserCookie)
      .expect(404);

    // 8. Delete relationship
    await request(app.getHttpServer())
      .delete(`${relUrl}/${relId}`)
      .set('Cookie', userCookie)
      .expect(204);

    // Verify deletion
    const listAfterDelete = await request(app.getHttpServer())
      .get(relUrl)
      .set('Cookie', userCookie)
      .expect(200);

    expect(listAfterDelete.body.total).toBe(0);
    expect(listAfterDelete.body.items.length).toBe(0);
  });
});
