import { BadRequestException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ArchivoSubido } from './storage.interface.js';
import { MAX_IMAGE_SIZE_BYTES, StorageService } from './storage.service.js';

function crearArchivo(overrides: Partial<ArchivoSubido> = {}): ArchivoSubido {
  const buffer = overrides.buffer ?? Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  return {
    originalname: 'foto.jpg',
    mimetype: 'image/jpeg',
    size: overrides.size ?? buffer.length,
    buffer,
    ...overrides,
  };
}

describe('StorageService', () => {
  let tempDir: string;
  let service: StorageService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mapeo-storage-test-'));
    const config = {
      get: (key: string, fallback?: unknown) => {
        if (key === 'app.storageMode') return 'local';
        if (key === 'app.storageLocalDir') return tempDir;
        return fallback;
      },
    };
    service = new StorageService(config as any);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('acepta JPEG, PNG y WebP dentro del límite y los guarda/elimina en modo local', async () => {
    for (const [mimetype, ext] of [
      ['image/jpeg', '.jpg'],
      ['image/png', '.png'],
      ['image/webp', '.webp'],
    ] as const) {
      const resultado = await service.subirImagen(
        crearArchivo({ mimetype, originalname: `img${ext}` }),
        'emprendimientos',
      );
      expect(resultado.url.startsWith('/uploads/emprendimientos/')).toBe(true);
      expect(resultado.url.endsWith(ext)).toBe(true);
      expect(existsSync(join(tempDir, resultado.key))).toBe(true);

      await service.eliminarArchivo(resultado.url);
      expect(existsSync(join(tempDir, resultado.key))).toBe(false);
    }
  });

  it('rechaza tipos MIME no permitidos (PDF, GIF, SVG)', async () => {
    for (const mimetype of ['application/pdf', 'image/gif', 'image/svg+xml', 'text/plain']) {
      await expect(service.subirImagen(crearArchivo({ mimetype }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
  });

  it('rechaza imágenes que superen 5 MB (RNF-08)', async () => {
    const demasiadoGrande = crearArchivo({
      size: MAX_IMAGE_SIZE_BYTES + 1,
      buffer: Buffer.alloc(16),
    });
    await expect(service.subirImagen(demasiadoGrande)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza archivos vacíos o ausentes', async () => {
    await expect(service.subirImagen(undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.subirImagen(crearArchivo({ buffer: Buffer.alloc(0), size: 0 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
