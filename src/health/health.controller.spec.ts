import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { appConfig } from '../config/app.config.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController (NestJS DI + ESM + Decorators)', () => {
  let controller: HealthController;
  let queryMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    queryMock = vi.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [appConfig],
        }),
      ],
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: {
            query: queryMock,
          } satisfies Partial<DataSource>,
        },
      ],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('debe resolver dependencias por inyección y retornar estado saludable con versión de PostGIS', async () => {
    queryMock.mockResolvedValueOnce([{ version: '3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1' }]);

    const result = await controller.check();

    expect(queryMock).toHaveBeenCalledWith('SELECT postgis_version() AS version');
    expect(result.status).toBe('ok');
    expect(result.database).toEqual({
      status: 'up',
      postgisVersion: '3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1',
    });
    expect(result.services).toEqual({
      whatsapp: 'mock',
      storage: 'local',
    });
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('debe lanzar ServiceUnavailableException si PostgreSQL o PostGIS no responden', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
