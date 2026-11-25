import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar estado del servidor, PostgreSQL y PostGIS',
    description:
      'Comprueba la conectividad activa con PostgreSQL y ejecuta SELECT postgis_version() para confirmar la extensión geoespacial.',
  })
  @ApiOkResponse({
    description: 'Servicio saludable y PostGIS operativo',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Error de conexión con PostgreSQL o extensión PostGIS no disponible',
  })
  async check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
