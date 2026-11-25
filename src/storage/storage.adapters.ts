import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { StorageAdapter } from './storage.interface.js';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
  }

  async save(buffer: Buffer, key: string): Promise<string> {
    const targetPath = this.resolveSafePath(key);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }

  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/?uploads\//, '');
    const targetPath = this.resolveSafePath(cleanKey);
    try {
      await unlink(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveSafePath(key: string): string {
    const resolved = resolve(this.baseDir, key);
    const rel = relative(this.baseDir, resolved);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('Ruta de archivo inválida fuera del directorio de almacenamiento');
    }
    return resolved;
  }
}

export class S3StorageAdapter implements StorageAdapter {
  constructor(
    private readonly bucket: string,
    private readonly publicUrlBase: string,
  ) {}

  async save(_buffer: Buffer, _key: string, _mimeType: string): Promise<string> {
    void this.bucket;
    void this.publicUrlBase;
    throw new Error(
      'STORAGE_MODE=s3 aún no tiene un cliente S3/R2 configurado. Instala @aws-sdk/client-s3 y configura S3StorageAdapter.',
    );
  }

  async delete(_key: string): Promise<void> {
    throw new Error(
      'STORAGE_MODE=s3 aún no tiene un cliente S3/R2 configurado. Instala @aws-sdk/client-s3 y configura S3StorageAdapter.',
    );
  }
}
