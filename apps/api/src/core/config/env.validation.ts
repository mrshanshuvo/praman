import { z } from 'zod';

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
