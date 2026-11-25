import { ApiProperty } from '@nestjs/swagger';

export class DatabaseHealthDto {
  @ApiProperty({ example: 'up', description: 'Estado de la conexión a PostgreSQL' })
  status: 'up';

  @ApiProperty({
    example: '3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1',
    description: 'Versión reportada por SELECT postgis_version()',
  })
  postgisVersion: string;
}

export class ExternalServicesModeDto {
  @ApiProperty({ example: 'mock', description: 'Modo configurado para el servicio de WhatsApp' })
  whatsapp: string;

  @ApiProperty({ example: 'local', description: 'Modo configurado para el almacenamiento de archivos' })
  storage: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Estado general del servicio' })
  status: 'ok';

  @ApiProperty({
    example: '2026-11-24T20:00:00.000Z',
    description: 'Marca de tiempo UTC del servidor (ISO 8601)',
  })
  timestamp: string;

  @ApiProperty({ type: DatabaseHealthDto })
  database: DatabaseHealthDto;

  @ApiProperty({ type: ExternalServicesModeDto })
  services: ExternalServicesModeDto;
}
