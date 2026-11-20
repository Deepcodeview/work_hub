import { EnvSchema, EnvConfig } from '@workhub/validation';

export const APP_CONFIG = {
  name: 'WorkHub',
  apiPrefix: '/api/v1',
  defaultTimezone: 'UTC',
  defaultPageLimit: 20,
  maxPageLimit: 100,
} as const;

export function loadEnvConfig(env: Record<string, string | undefined> = process.env): EnvConfig {
  return EnvSchema.parse(env);
}
