import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3000,
  fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? 'en',
}));
