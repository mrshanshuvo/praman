export * from './candidate';
export * from './job-description';
export * from './match';
export * from './resume';
export * from './strategy';

import { z } from 'zod';

export const HealthCheckSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().optional(),
  uptime: z.number().optional(),
  version: z.string().optional(),
  service: z.string().optional(),
});
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
