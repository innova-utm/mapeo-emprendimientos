import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET ?? '',
  whatsappMode: process.env.WHATSAPP_MODE ?? 'mock',
  storageMode: process.env.STORAGE_MODE ?? 'local',
}));
