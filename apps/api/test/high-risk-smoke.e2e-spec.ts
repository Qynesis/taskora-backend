import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

type DevRole = 'seeker' | 'provider' | 'admin';

jest.setTimeout(30000);

const devAuthHeaders = (role: DevRole, id: string, email: string) => ({
  'x-dev-user-role': role,
  'x-dev-user-id': id,
  'x-dev-user-email': email,
});

describe('High Risk Endpoints Smoke E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  const seeker = {
    id: '00000000-0000-0000-0000-000000000101',
    email: 'smoke-seeker@example.com',
  };

  const admin = {
    id: '00000000-0000-0000-0000-000000000102',
    email: 'smoke-admin@example.com',
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Ensure reportable-users has a local user row to evaluate role-path safely.
    await request(app.getHttpServer())
      .post('/api/users/sync')
      .set(devAuthHeaders('seeker', seeker.id, seeker.email));
  });

  afterAll(async () => {
    const httpServer = app?.getHttpServer?.();
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err?: Error) => (err ? reject(err) : resolve()));
      });
    }
    if (app) {
      await app.close();
    }
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('GET /api/providers should respond for seeker role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/providers')
      .query({ page: 1, limit: 10 })
      .set(devAuthHeaders('seeker', seeker.id, seeker.email));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/admin/providers should respond for admin role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/providers')
      .query({ page: 1, limit: 10 })
      .set(devAuthHeaders('admin', admin.id, admin.email));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/admin/seekers should respond for admin role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/seekers')
      .query({ page: 1, limit: 10 })
      .set(devAuthHeaders('admin', admin.id, admin.email));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/reports/reportable-users should respond for seeker role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/reportable-users')
      .query({ page: 1, limit: 10 })
      .set(devAuthHeaders('seeker', seeker.id, seeker.email));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/conversations should respond for seeker role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/conversations')
      .query({ page: 1, limit: 10 })
      .set(devAuthHeaders('seeker', seeker.id, seeker.email));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
