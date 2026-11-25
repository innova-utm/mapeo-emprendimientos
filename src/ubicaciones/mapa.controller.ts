import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/index.js';
import { MapaUbicacionesQueryDto } from './dto/ubicacion.dto.js';
import { MapaMarcadorDto } from './dto/ubicacion-response.dto.js';
import { UbicacionesService } from './ubicaciones.service.js';

@ApiTags('Mapa')
@Public()
@Controller('mapa')
export class MapaController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Get('ubicaciones')
  @ApiOperation({
    summary: 'Listar marcadores activos en el mapa (RF-MAP-01 a RF-MAP-04)',
    description:
      'Retorna ubicaciones activas pertenecientes únicamente a emprendimientos activos. ' +
      'Soporta filtro espacial por radio (ST_DWithin sobre índice GIST) y cálculo de distancia (ST_Distance).',
  })
  @ApiOkResponse({ type: MapaMarcadorDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Parámetros geoespaciales incompletos o inválidos' })
  listarUbicaciones(@Query() query: MapaUbicacionesQueryDto): Promise<MapaMarcadorDto[]> {
    return this.ubicacionesService.listarMapa(query);
  }
}
