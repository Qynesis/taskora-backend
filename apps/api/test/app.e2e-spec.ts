import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('App E2E', () => {
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

  it('GET /api/dev/ping should return pong', async () => {
    const res = await request(app.getHttpServer()).get('/api/dev/ping');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pong', true);
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /api/does-not-exist should return 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/does-not-exist');

    expect(res.status).toBe(404);
  });

  it('POST /api/webhooks/stripe should reject missing stripe signature', async () => {
    const res = await request(app.getHttpServer()).post('/api/webhooks/stripe').send({});

    expect(res.status).toBe(400);
    expect(String(res.body.message)).toContain('Missing stripe-signature header');
  });

  it('POST /api/webhooks/stripe should reject missing raw body when signature is provided', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send({ event: 'test' });

    expect(res.status).toBe(400);
    expect(String(res.body.message)).toContain('Missing raw body');
  });

  it('GET /api/webhooks/stripe should return 404 because only POST is implemented', async () => {
    const res = await request(app.getHttpServer()).get('/api/webhooks/stripe');

    expect(res.status).toBe(404);
  });
});
