export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ArchivoGuardado {
  /** Clave relativa dentro del almacenamiento (ej. emprendimientos/uuid.webp). */
  key: string;
  /** URL accesible públicamente (relativa en modo local, absoluta en S3/R2). */
  url: string;
  mimeType: string;
  size: number;
}

/**
 * Contrato desacoplado de almacenamiento de objetos.
 * Permite intercambiar almacenamiento local por S3 / Cloudflare R2 sin modificar los servicios consumidores.
 */
export interface StorageAdapter {
  save(buffer: Buffer, key: string, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
