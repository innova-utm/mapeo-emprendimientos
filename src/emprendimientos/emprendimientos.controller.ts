import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, Public, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import type { ArchivoSubido } from '../storage/storage.interface.js';
import {
  CreateEmprendimientoDto,
  CreateRedSocialDto,
  ListarEmprendimientosQueryDto,
  SubirImagenEmprendimientoDto,
  UpdateEmprendimientoDto,
  UpdateRedSocialDto,
} from './dto/emprendimiento.dto.js';
import {
  EmprendimientoDetalleDto,
  ImagenEmprendimientoResponseDto,
  PaginatedEmprendimientosDto,
  RedSocialResponseDto,
} from './dto/emprendimiento-response.dto.js';
import { EmprendimientosService } from './emprendimientos.service.js';

@ApiTags('Emprendimientos')
@Controller('emprendimientos')
export class EmprendimientosController {
  constructor(private readonly emprendimientosService: EmprendimientosService) {}

  // ===========================================================================
  // Gestión del titular (RF-EMP-01 a RF-EMP-03)
  // ===========================================================================

  @Post()
  @ApiBearerAuth()
  @Roles('consumidor')
  @ApiOperation({
    summary: 'Crear emprendimiento 1:1 (RF-EMP-01)',
    description:
      'Crea el único emprendimiento del usuario consumidor, genera un slug amigable y actualiza su rol a `emprendedor`. ' +
      'Nota: renueva el token con POST /api/v1/auth/refresh para obtener un accessToken con rol `emprendedor`.',
  })
  @ApiCreatedResponse({ type: EmprendimientoDetalleDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos o categoría inactiva' })
  @ApiConflictResponse({ description: 'El usuario ya posee un emprendimiento registrado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Requiere rol consumidor' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateEmprendimientoDto,
  ): Promise<EmprendimientoDetalleDto> {
    return this.emprendimientosService.crear(usuario.id, dto);
  }

  @Get('mi-emprendimiento')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @ApiOperation({
    summary: 'Obtener ficha completa de mi emprendimiento (RF-EMP-02)',
    description:
      'Devuelve todos los datos comerciales, redes sociales, imágenes y ubicaciones del emprendimiento del usuario autenticado.',
  })
  @ApiOkResponse({ type: EmprendimientoDetalleDto })
  @ApiNotFoundResponse({ description: 'El usuario no tiene un emprendimiento registrado' })
  obtenerMiEmprendimiento(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<EmprendimientoDetalleDto> {
    return this.emprendimientosService.obtenerMiEmprendimiento(usuario.id);
  }

  @Patch('mi-emprendimiento')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @ApiOperation({
    summary: 'Actualizar mi emprendimiento (RF-EMP-02)',
    description:
      'Permite editar datos comerciales, WhatsApp E.164 y alternar estado entre activo e inactivo. ' +
      'Si el emprendimiento está suspendido por un administrador, rechaza la reactivación con 403.',
  })
  @ApiOkResponse({ type: EmprendimientoDetalleDto })
  @ApiForbiddenResponse({ description: 'No se puede reactivar un emprendimiento suspendido' })
  @ApiNotFoundResponse({ description: 'Emprendimiento no encontrado' })
  actualizarMiEmprendimiento(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: UpdateEmprendimientoDto,
  ): Promise<EmprendimientoDetalleDto> {
    return this.emprendimientosService.actualizarMiEmprendimiento(usuario.id, dto);
  }

  // ---------------------------------------------------------------------------
  // Redes sociales del propio emprendimiento
  // ---------------------------------------------------------------------------

  @Post('mi-emprendimiento/redes')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @ApiOperation({ summary: 'Agregar red social al emprendimiento (RF-EMP-03)' })
  @ApiCreatedResponse({ type: RedSocialResponseDto })
  crearRedSocial(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateRedSocialDto,
  ): Promise<RedSocialResponseDto> {
    return this.emprendimientosService.crearRedSocial(usuario.id, dto);
  }

  @Patch('mi-emprendimiento/redes/:redId')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @ApiOperation({ summary: 'Actualizar red social del emprendimiento (RF-EMP-03)' })
  @ApiParam({ name: 'redId', format: 'uuid' })
  @ApiOkResponse({ type: RedSocialResponseDto })
  @ApiNotFoundResponse({ description: 'Red social no encontrada' })
  actualizarRedSocial(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('redId', new ParseUUIDPipe()) redId: string,
    @Body() dto: UpdateRedSocialDto,
  ): Promise<RedSocialResponseDto> {
    return this.emprendimientosService.actualizarRedSocial(usuario.id, redId, dto);
  }

  @Delete('mi-emprendimiento/redes/:redId')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar red social del emprendimiento (RF-EMP-03)' })
  @ApiParam({ name: 'redId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Red social eliminada' })
  @ApiNotFoundResponse({ description: 'Red social no encontrada' })
  eliminarRedSocial(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('redId', new ParseUUIDPipe()) redId: string,
  ): Promise<void> {
    return this.emprendimientosService.eliminarRedSocial(usuario.id, redId);
  }

  // ---------------------------------------------------------------------------
  // Imágenes del propio emprendimiento
  // ---------------------------------------------------------------------------

  @Post('mi-emprendimiento/imagenes')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir imagen al emprendimiento (RF-EMP-03 / RNF-08)',
    description:
      'Sube una imagen JPEG, PNG o WebP (máximo 5 MB) mediante multipart/form-data y la registra en la galería del emprendimiento.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (image/jpeg, image/png, image/webp; máx 5 MB)',
        },
        esPrincipal: {
          type: 'boolean',
          default: false,
          description: 'Si es true, marca esta imagen como portada principal',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ImagenEmprendimientoResponseDto })
  @ApiBadRequestResponse({ description: 'Archivo inválido, MIME no permitido o mayor a 5 MB' })
  subirImagen(
    @CurrentUser() usuario: UsuarioAutenticado,
    @UploadedFile() file: ArchivoSubido | undefined,
    @Body() dto: SubirImagenEmprendimientoDto,
  ): Promise<ImagenEmprendimientoResponseDto> {
    return this.emprendimientosService.subirImagen(usuario.id, file, dto.esPrincipal ?? false);
  }

  @Delete('mi-emprendimiento/imagenes/:imagenId')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar imagen del emprendimiento (RF-EMP-03)' })
  @ApiParam({ name: 'imagenId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Imagen eliminada' })
  @ApiNotFoundResponse({ description: 'Imagen no encontrada' })
  eliminarImagen(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<void> {
    return this.emprendimientosService.eliminarImagen(usuario.id, imagenId);
  }

  @Patch('mi-emprendimiento/imagenes/:imagenId/principal')
  @ApiBearerAuth()
  @Roles('emprendedor')
  @ApiOperation({
    summary: 'Marcar imagen como portada principal (RF-EMP-03)',
    description:
      'Desmarca transaccionalmente cualquier otra imagen principal del emprendimiento antes de marcar la elegida.',
  })
  @ApiParam({ name: 'imagenId', format: 'uuid' })
  @ApiOkResponse({ type: ImagenEmprendimientoResponseDto })
  @ApiNotFoundResponse({ description: 'Imagen no encontrada' })
  marcarImagenPrincipal(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<ImagenEmprendimientoResponseDto> {
    return this.emprendimientosService.marcarImagenPrincipal(usuario.id, imagenId);
  }

  // ===========================================================================
  // Exploración pública (Módulo B: RF-DES-01 a RF-DES-05)
  // ===========================================================================

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Explorar emprendimientos activos (RF-DES-01, RF-DES-04, RF-DES-05)',
    description:
      'Listado paginado público de emprendimientos activos con búsqueda textual, filtros por categoría/provincia/cantón y ordenamiento.',
  })
  @ApiOkResponse({ type: PaginatedEmprendimientosDto })
  listarPublicos(
    @Query() query: ListarEmprendimientosQueryDto,
  ): Promise<PaginatedEmprendimientosDto> {
    return this.emprendimientosService.listarPublicos(query);
  }

  @Get(':slugOrId')
  @Public()
  @ApiOperation({
    summary: 'Obtener ficha pública de un emprendimiento por slug o UUID (RF-DES-02)',
    description:
      'Retorna los datos públicos, galería, redes sociales, ubicaciones activas y calificación promedio. Devuelve 404 si está inactivo o suspendido.',
  })
  @ApiParam({
    name: 'slugOrId',
    description: 'Slug amigable (ej. cafe-manabi-de-altura) o UUID del emprendimiento',
  })
  @ApiOkResponse({ type: EmprendimientoDetalleDto })
  @ApiNotFoundResponse({ description: 'Emprendimiento no encontrado o no activo' })
  obtenerDetallePublico(@Param('slugOrId') slugOrId: string): Promise<EmprendimientoDetalleDto> {
    return this.emprendimientosService.obtenerDetallePublico(slugOrId);
  }
}
