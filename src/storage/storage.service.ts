import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { LocalStorageAdapter, S3StorageAdapter } from './storage.adapters.js';
import type { ArchivoGuardado, ArchivoSubido, StorageAdapter } from './storage.interface.js';

export type StorageMode = 'local' | 's3';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (RNF-08)

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapter: StorageAdapter;
  readonly modo: StorageMode;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('app.storageMode', 'local');
    this.modo = configured === 's3' ? 's3' : 'local';

    if (this.modo === 's3') {
      const bucket = this.configService.get<string>('app.storageS3Bucket', '');
      const publicUrl = this.configService.get<string>('app.storagePublicUrl', '');
      this.adapter = new S3StorageAdapter(bucket, publicUrl);
    } else {
      const uploadsDir = this.configService.get<string>(
        'app.storageLocalDir',
        join(process.cwd(), 'uploads'),
      );
      this.adapter = new LocalStorageAdapter(uploadsDir);
    }
  }

  /** Valida tipo MIME permitido y límite de 5 MB (RNF-08). */
  validarImagen(file: ArchivoSubido | undefined | null): asserts file is ArchivoSubido {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Debes adjuntar un archivo de imagen válido');
    }

    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato de imagen no permitido (${file.mimetype}). Formatos aceptados: JPEG, PNG y WebP`,
      );
    }

    const size = file.size ?? file.buffer.length;
    if (size <= 0) {
      throw new BadRequestException('El archivo de imagen está vacío');
    }

    if (size > MAX_IMAGE_SIZE_BYTES || file.buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('La imagen supera el tamaño máximo permitido de 5 MB');
    }
  }

  async subirImagen(
    file: ArchivoSubido | undefined | null,
    carpeta = 'emprendimientos',
  ): Promise<ArchivoGuardado> {
    this.validarImagen(file);

    const ext = MIME_TO_EXT[file.mimetype] ?? 'bin';
    const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, '');
    const key = `${carpetaLimpia}/${randomUUID()}.${ext}`;
    const url = await this.adapter.save(file.buffer, key, file.mimetype);

    return {
      key,
      url,
      mimeType: file.mimetype,
      size: file.size ?? file.buffer.length,
    };
  }

  async eliminarArchivo(urlOKey: string): Promise<void> {
    if (!urlOKey) return;
    try {
      const key = urlOKey.replace(/^\/?uploads\//, '');
      await this.adapter.delete(key);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar el archivo "${urlOKey}" del almacenamiento: ${(error as Error).message}`,
      );
    }
  }
}
