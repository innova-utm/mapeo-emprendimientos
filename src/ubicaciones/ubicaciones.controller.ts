import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import { UbicacionResumenDto } from '../emprendimientos/dto/emprendimiento-response.dto.js';
import { CreateUbicacionDto, UpdateUbicacionDto } from './dto/ubicacion.dto.js';
import { UbicacionesService } from './ubicaciones.service.js';

@ApiTags('Ubicaciones')
@ApiBearerAuth()
@Roles('emprendedor')
@Controller('emprendimientos/mi-emprendimiento/ubicaciones')
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar ubicación pública del emprendimiento (RF-EMP-04)',
    description:
      'Crea un punto de venta/retiro validando coordenadas dentro de Ecuador, pertenencia de parroquia a cantón y persistiendo GEOGRAPHY(POINT, 4326) en PostGIS.',
  })
  @ApiCreatedResponse({ type: UbicacionResumenDto })
  @ApiBadRequestResponse({
    description: 'Coordenadas fuera de Ecuador o parroquia incoherente con el cantón',
  })
  @ApiForbiddenResponse({ description: 'Requiere rol emprendedor' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateUbicacionDto,
  ): Promise<UbicacionResumenDto> {
    return this.ubicacionesService.crear(usuario.id, dto);
  }

  @Patch(':ubicacionId')
  @ApiOperation({ summary: 'Actualizar ubicación del emprendimiento (RF-EMP-04)' })
  @ApiParam({ name: 'ubicacionId', format: 'uuid' })
  @ApiOkResponse({ type: UbicacionResumenDto })
  @ApiBadRequestResponse({ description: 'Coordenadas fuera de Ecuador o datos inválidos' })
  @ApiNotFoundResponse({ description: 'Ubicación no encontrada' })
  actualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('ubicacionId', new ParseUUIDPipe()) ubicacionId: string,
    @Body() dto: UpdateUbicacionDto,
  ): Promise<UbicacionResumenDto> {
    return this.ubicacionesService.actualizar(usuario.id, ubicacionId, dto);
  }

  @Delete(':ubicacionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar ubicación del emprendimiento (borrado lógico)',
    description: 'Cambia el estado de la ubicación a `inactivo` sin eliminarla físicamente.',
  })
  @ApiParam({ name: 'ubicacionId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Ubicación desactivada (estado = inactivo)' })
  @ApiNotFoundResponse({ description: 'Ubicación no encontrada' })
  eliminar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('ubicacionId', new ParseUUIDPipe()) ubicacionId: string,
  ): Promise<void> {
    return this.ubicacionesService.eliminarLogico(usuario.id, ubicacionId);
  }
}
