// FILE: backend/src/config/env.js
// Environment variable validation using Zod.
// Fails fast on startup if required vars are missing or malformed.

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string(),
  AWS_S3_SIGNED_URL_EXPIRES: z.coerce.number().default(3600),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(2),

  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  DEFAULT_STORAGE_QUOTA_MB: z.coerce.number().default(10),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
