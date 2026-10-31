import { NestFactory, Reflector } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AppConfigType } from './config/namespaces/app.config';
import { GlobalExceptionFilter } from './http/filters/global-exception.filter';
import { TransformInterceptor } from './http/interceptors/transform.interceptor';
import { createGlobalValidationPipe } from './common/validation.pipe';
import { RequestIdMiddleware } from './logger/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfigType>('app')!;

  // Mount Socket.io HTTP handler on the Express server (required for WS + polling)
  app.useWebSocketAdapter(new IoAdapter(app));

  // HTTP security headers
  app.use(helmet());

  // Use Pino as the NestJS logger
  app.useLogger(app.get(Logger));

  // Apply request-id middleware globally without route-pattern conversion.
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => requestIdMiddleware.use(req, res, next));

  // Global prefix
  app.setGlobalPrefix(appConfig.apiPrefix);

  // Global pipes, filters, interceptors
  app.useGlobalPipes(createGlobalValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // Swagger — disabled in production unless SWAGGER_ENABLED=true
  if (appConfig.nodeEnv !== 'production' || process.env['SWAGGER_ENABLED'] === 'true') {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Service App API')
    .setDescription(
      'Service App API\n\n' +
      '## User Roles\n\n' +
      'When registering or switching roles, pass one of the following values for the `role` field:\n\n' +
      '| Role | Value | Description |\n' +
      '|------|-------|-------------|\n' +
      '| Seeker | `seeker` | Posts jobs and selects providers. Default role assigned on first sync. |\n' +
      '| Provider | `provider` | Browses the job feed, submits bids, and delivers services. |\n' +
      '| Admin | `admin` | Platform administrator. Assigned server-side only — cannot be self-registered. |\n\n'
    )
    .setVersion('1.0')
    .addBearerAuth()
    // ── Admin ────────────────────────────────────────────────────────────────
    .addTag('Admin | Console', 'User management, verification review, reports & payouts (Admin only)')
    .addTag('Admin | Audit', 'Full audit log access — read and write (Admin only)')
    // ── Provider ─────────────────────────────────────────────────────────────
    .addTag('Provider | Bids', 'My bids and bid updates (Provider only)')
    .addTag('Provider | Categories', 'Create categories (Provider only)')
    .addTag('Provider | Jobs', 'Job feed, my services, and bid submission (Provider only)')
    .addTag('Provider | My Profile', 'Professional details, work info, employees, bank details & certifications (Provider only)')
    .addTag('Provider | Payments', 'Stripe Connect onboarding and payment management (Provider only)')
    .addTag('Provider | Skills', 'List and create skills from the provider dashboard (Provider only)')
    .addTag('Provider | Verification', 'Identity & document verification case management (Provider only)')
    // ── Seeker ───────────────────────────────────────────────────────────────
    .addTag('Seeker | Billing', 'Stripe customer record management (Seeker only)')
    .addTag('Seeker | Cards', 'Saved payment cards — list and set default (Seeker only)')
    .addTag('Seeker | Jobs', 'Post and manage job requests, view bids (Seeker only)')
    .addTag('Seeker | Providers', 'Browse and favourite providers (Seeker only)')
    .addTag('Seeker | Reviews', 'Submit and browse provider reviews (Seeker only)')
    .addTag('Seeker | Selections', 'Select a provider bid for a job (Seeker only)')
    // ── Common ───────────────────────────────────────────────────────────────
    .addTag('Common | Account', 'User sync and notification settings (All roles)')
    .addTag('Common | Conversations', 'Inbox / conversation list (Seeker & Provider)')
    .addTag('Common | Jobs', 'View job details and update job status (Seeker & Provider)')
    .addTag('Common | Messages', 'Send and list messages within a conversation (All roles)')
    .addTag('Common | My Profile', 'Basic profile — create, view and update (Seeker & Provider)')
    .addTag('Common | Reports', 'Submit user reports and list reportable users (Seeker & Provider)')
    .addTag('Common | Storage', 'Generate pre-signed file upload URLs (All roles)')
    .addTag('Common | Subscriptions', 'Subscription checkout, lookup and cancellation')
    // ── Public ───────────────────────────────────────────────────────────────
    .addTag('Public | Categories', 'Browse available categories (no auth required)')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }

  // CORS
  const allowedOrigins = new Set(appConfig.corsOrigins);
  app.enableCors({
    credentials: appConfig.corsCredentials,
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Non-browser clients (no Origin header) are allowed.
      if (!origin) {
        return callback(null, true);
      }

      // If no allowlist is configured, allow all origins (recommended for local/dev only).
      if (allowedOrigins.size === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin "${origin}" is not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 60 * 60 * 24,
    optionsSuccessStatus: 204,
  });

  await app.listen(appConfig.port);
}

void bootstrap();
