import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// =============================================================================
// 1. Zod Environment Schema & Runtime Validation
// =============================================================================

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().optional().default(''),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // AI & Models
  OPENAI_API_KEY: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  AI_MODELS: z.string().optional(),
  AI_MODEL: z.string().optional(),

  // Cloudflare R2 Object Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('praman-resumes'),

  // Auth & Security
  JWT_SECRET: z.string().default('praman-dev-secret-super-secure-key-change-in-prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `  - [${i.path.join('.')}]: ${i.message}`)
      .join('\n');
    throw new Error(`\n❌ Environment validation error:\n${errorDetails}\n`);
  }
  return parsed.data;
}

// =============================================================================
// 2. Namespaced Configuration Loaders (registerAs)
// =============================================================================

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || '',
}));

export const aiConfig = registerAs('ai', () => ({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
  baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  models: process.env.AI_MODELS || process.env.AI_MODEL,
}));

export const r2Config = registerAs('r2', () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME || 'praman-resumes',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL!,
}));

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'praman-dev-secret-super-secure-key-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));

export const configLoaders = [appConfig, aiConfig, r2Config, databaseConfig, authConfig];

export type AppConfig = ReturnType<typeof appConfig>;
export type AiConfig = ReturnType<typeof aiConfig>;
export type R2Config = ReturnType<typeof r2Config>;
export type DatabaseConfig = ReturnType<typeof databaseConfig>;
export type AuthConfig = ReturnType<typeof authConfig>;
