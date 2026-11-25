import { registerAs } from '@nestjs/config';

/** Falla rápido al arrancar la app si el secreto JWT es débil o no existe. */
export function assertJwtSecret(secret: string | undefined): void {
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 caracteres.');
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const appConfig = registerAs('app', () => {
  const jwtSecret = process.env.JWT_SECRET ?? '';
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    jwtSecret,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || `${jwtSecret}:refresh`,
    jwtAccessTtl: parsePositiveInt(process.env.JWT_ACCESS_TTL_SECONDS, 900),
    jwtRefreshTtl: parsePositiveInt(process.env.JWT_REFRESH_TTL_SECONDS, 604800),
    whatsappMode: process.env.WHATSAPP_MODE ?? 'mock',
    whatsappBusinessNumber: process.env.WHATSAPP_BUSINESS_NUMBER ?? '593999999999',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? '',
    storageMode: process.env.STORAGE_MODE ?? 'local',
    storageLocalDir: process.env.STORAGE_LOCAL_DIR || undefined,
    storageS3Bucket: process.env.STORAGE_S3_BUCKET ?? '',
    storagePublicUrl: process.env.STORAGE_PUBLIC_URL ?? '',
  };
});
