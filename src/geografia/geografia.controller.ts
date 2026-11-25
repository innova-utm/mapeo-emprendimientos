import { Public } from '../common/auth/index.js';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CantonResponseDto,
  ParroquiaResponseDto,
  ProvinciaResponseDto,
} from './dto/geografia-response.dto.js';
import { GeografiaService } from './geografia.service.js';

@ApiTags('Geografía')
@Public()
@Controller('geografia')
export class GeografiaController {
  constructor(private readonly geografiaService: GeografiaService) {}

  @Get('provincias')
  @ApiOperation({
    summary: 'Listar provincias de Ecuador',
    description: 'Retorna todas las provincias registradas ordenadas alfabéticamente.',
  })
  @ApiOkResponse({
    description: 'Lista de provincias',
    type: ProvinciaResponseDto,
    isArray: true,
  })
  async getProvincias(): Promise<ProvinciaResponseDto[]> {
    return this.geografiaService.findProvincias();
  }

  @Get('provincias/:provinciaId/cantones')
  @ApiOperation({
    summary: 'Listar cantones de una provincia',
    description: 'Retorna los cantones pertenecientes a la provincia indicada.',
  })
  @ApiParam({
    name: 'provinciaId',
    description: 'UUID de la provincia',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Lista de cantones de la provincia',
    type: CantonResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'El parámetro provinciaId no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Provincia no encontrada' })
  async getCantonesByProvincia(
    @Param('provinciaId', new ParseUUIDPipe()) provinciaId: string,
  ): Promise<CantonResponseDto[]> {
    return this.geografiaService.findCantonesByProvincia(provinciaId);
  }

  @Get('cantones/:cantonId/parroquias')
  @ApiOperation({
    summary: 'Listar parroquias de un cantón',
    description: 'Retorna las parroquias urbanas y rurales pertenecientes al cantón indicado.',
  })
  @ApiParam({
    name: 'cantonId',
    description: 'UUID del cantón',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Lista de parroquias del cantón',
    type: ParroquiaResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'El parámetro cantonId no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Cantón no encontrado' })
  async getParroquiasByCanton(
    @Param('cantonId', new ParseUUIDPipe()) cantonId: string,
  ): Promise<ParroquiaResponseDto[]> {
    return this.geografiaService.findParroquiasByCanton(cantonId);
  }
}
