import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // Queue
  QUEUE_DEFAULT_ATTEMPTS: Joi.number().default(3),
  QUEUE_DEFAULT_BACKOFF: Joi.number().default(5000),

  // Cache
  CACHE_DEFAULT_TTL: Joi.number().default(60),
  CACHE_MAX_ITEMS: Joi.number().default(1000),

  // Auth (JWT fields only needed when using JwtLocalStrategy)
  JWT_SECRET: Joi.string().optional(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  JWT_ACCESS_SECRET: Joi.string().optional(),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),

  // Auth bypass (dev only)
  AUTH_BYPASS: Joi.boolean().default(false),

  // Supabase (not required when AUTH_BYPASS=true)
  SUPABASE_URL: Joi.string().uri().when('AUTH_BYPASS', { is: true, then: Joi.optional(), otherwise: Joi.required() }),
  SUPABASE_ANON_KEY: Joi.string().when('AUTH_BYPASS', { is: true, then: Joi.optional(), otherwise: Joi.required() }),
  // Service-role key — optional. Only used for admin operations (deleting a user's auth identity on
  // account deletion). Absent/blank → auth-user deletion is skipped (logged), the rest still works.
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),

  // Azure Blob Storage
  AZURE_STORAGE_CONNECTION_STRING: Joi.string().required(),
  AZURE_STORAGE_PUBLIC_CONTAINER: Joi.string().default('serviceapp-public'),
  AZURE_STORAGE_PRIVATE_CONTAINER: Joi.string().default('serviceapp-private'),

  // Stripe keys
  STRIPE_SEC_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET_CONNECT: Joi.string().optional(),
  STRIPE_API_VERSION: Joi.string().optional(),

  // Logger
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  LOG_PRETTY: Joi.boolean().default(false),
  DB_LOG_QUERIES: Joi.boolean().default(false),

  // Worker health
  WORKER_HEALTH_PORT: Joi.number().default(3001),

  // Database field encryption (AES-256-GCM for bank details)
  DB_ENCRYPTION_KEY: Joi.string().length(64).required(),

  // Esendex (SMS / OTP)
  ESENDEX_ACCOUNT_REF: Joi.string().required(),
  ESENDEX_USERNAME: Joi.string().required(),
  ESENDEX_PASSWORD: Joi.string().required(),
  ESENDEX_ORIGINATOR: Joi.string().required(),

  // Resend (transactional email)
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_ADDRESS: Joi.string().email().default('noreply@taskoraservices.com.au'),
  CONTACT_TO_EMAIL: Joi.string().email().default('contact@taskoraservices.com.au'),

});
