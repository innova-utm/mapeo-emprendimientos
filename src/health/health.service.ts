import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { HealthResponseDto } from './dto/health-response.dto.js';

interface PostgisVersionRow {
  version: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<HealthResponseDto> {
    try {
      const rows = await this.dataSource.query<PostgisVersionRow[]>(
        'SELECT postgis_version() AS version',
      );
      const postgisVersion = rows[0]?.version;

      if (!postgisVersion) {
        throw new Error('La consulta postgis_version() no devolvió resultados');
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'up',
          postgisVersion,
        },
        services: {
          whatsapp: this.configService.get<string>('app.whatsappMode', 'mock'),
          storage: this.configService.get<string>('app.storageMode', 'local'),
        },
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Health check fallido en PostgreSQL/PostGIS: ${detail}`);
      throw new ServiceUnavailableException(
        'No se pudo verificar la conexión con PostgreSQL o la extensión PostGIS',
      );
    }
  }
}
