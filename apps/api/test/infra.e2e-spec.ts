import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Infra E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
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

  it('GET /api/health should return healthy dependencies', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');

    expect([200, 503]).toContain(res.status);
    expect(['ok', 'error']).toContain(res.body.status);
    expect(res.body.details?.database?.status).toBe('up');
    expect(res.body.details?.redis?.status).toBe('up');
    expect(['up', 'down']).toContain(res.body.details?.memory_heap?.status);
  });
});
