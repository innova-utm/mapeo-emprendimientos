import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriaCatalogoDto, DocumentoLegalDto } from '../catalogos/dto/catalogo-response.dto.js';
import { CurrentUser, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import { AdminService } from './admin.service.js';
import {
  CreateCategoriaAdminDto,
  CreateDocumentoLegalAdminDto,
  UpdateCategoriaAdminDto,
  UpdateDocumentoLegalAdminDto,
} from './dto/admin-catalogos.dto.js';
import {
  ActualizarReporteAdminDto,
  ListarEmprendimientosAdminQueryDto,
  ListarReportesAdminQueryDto,
  ModerarEmprendimientoDto,
} from './dto/admin-moderacion.dto.js';
import {
  EstadisticasDistribucionDto,
  EstadisticasResumenDto,
  ModeracionResponseDto,
  PaginatedEmprendimientosAdminDto,
  PaginatedReportesAdminDto,
  ReporteAdminResponseDto,
} from './dto/admin-response.dto.js';

@ApiTags('Administración')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Requiere rol administrador' })
@Roles('administrador')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===========================================================================
  // Catálogos (RF-ADM-02, RF-ADM-03)
  // ===========================================================================

  @Post('categorias-emprendimiento')
  @ApiOperation({ summary: 'Crear categoría de emprendimiento (RF-ADM-02)' })
  @ApiCreatedResponse({ type: CategoriaCatalogoDto })
  @ApiConflictResponse({ description: 'Nombre de categoría duplicado' })
  crearCategoriaEmprendimiento(@Body() dto: CreateCategoriaAdminDto): Promise<CategoriaCatalogoDto> {
    return this.adminService.crearCategoriaEmprendimiento(dto);
  }

  @Patch('categorias-emprendimiento/:id')
  @ApiOperation({ summary: 'Editar o activar/desactivar categoría de emprendimiento (RF-ADM-02)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoriaCatalogoDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiConflictResponse({ description: 'Nombre de categoría duplicado' })
  actualizarCategoriaEmprendimiento(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoriaAdminDto,
  ): Promise<CategoriaCatalogoDto> {
    return this.adminService.actualizarCategoriaEmprendimiento(id, dto);
  }

  @Post('categorias-producto')
  @ApiOperation({ summary: 'Crear categoría de producto (RF-ADM-03)' })
  @ApiCreatedResponse({ type: CategoriaCatalogoDto })
  @ApiConflictResponse({ description: 'Nombre de categoría duplicado' })
  crearCategoriaProducto(@Body() dto: CreateCategoriaAdminDto): Promise<CategoriaCatalogoDto> {
    return this.adminService.crearCategoriaProducto(dto);
  }

  @Patch('categorias-producto/:id')
  @ApiOperation({ summary: 'Editar o activar/desactivar categoría de producto (RF-ADM-03)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoriaCatalogoDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiConflictResponse({ description: 'Nombre de categoría duplicado' })
  actualizarCategoriaProducto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoriaAdminDto,
  ): Promise<CategoriaCatalogoDto> {
    return this.adminService.actualizarCategoriaProducto(id, dto);
  }

  // ===========================================================================
  // Documentos legales (RF-ADM-10)
  // ===========================================================================

  @Post('documentos-legales')
  @ApiOperation({ summary: 'Publicar nueva versión de documento legal (RF-ADM-10)' })
  @ApiCreatedResponse({ type: DocumentoLegalDto })
  @ApiConflictResponse({ description: 'Ya existe un documento con el mismo tipo y versión' })
  crearDocumentoLegal(@Body() dto: CreateDocumentoLegalAdminDto): Promise<DocumentoLegalDto> {
    return this.adminService.crearDocumentoLegal(dto);
  }

  @Patch('documentos-legales/:id')
  @ApiOperation({ summary: 'Editar documento legal o cambiar estado activo/inactivo (RF-ADM-10)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: DocumentoLegalDto })
  @ApiNotFoundResponse({ description: 'Documento legal no encontrado' })
  actualizarDocumentoLegal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDocumentoLegalAdminDto,
  ): Promise<DocumentoLegalDto> {
    return this.adminService.actualizarDocumentoLegal(id, dto);
  }

  // ===========================================================================
  // Bandeja de reportes (RF-ADM-04, RF-ADM-05)
  // ===========================================================================

  @Get('reportes')
  @ApiOperation({ summary: 'Listar bandeja administrativa de reportes (RF-ADM-04)' })
  @ApiOkResponse({ type: PaginatedReportesAdminDto })
  listarReportes(@Query() query: ListarReportesAdminQueryDto): Promise<PaginatedReportesAdminDto> {
    return this.adminService.listarReportes(query);
  }

  @Patch('reportes/:reporteId')
  @ApiOperation({
    summary: 'Actualizar estado y resolución de un reporte (RF-ADM-05)',
    description:
      'Registra `resuelto_por` y `fecha_resolucion = NOW()` automáticamente cuando el estado pasa a `resuelto` o `descartado`.',
  })
  @ApiParam({ name: 'reporteId', format: 'uuid' })
  @ApiOkResponse({ type: ReporteAdminResponseDto })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado' })
  actualizarReporte(
    @CurrentUser() admin: UsuarioAutenticado,
    @Param('reporteId', new ParseUUIDPipe()) reporteId: string,
    @Body() dto: ActualizarReporteAdminDto,
  ): Promise<ReporteAdminResponseDto> {
    return this.adminService.actualizarReporte(admin.id, reporteId, dto);
  }

  // ===========================================================================
  // Moderación reactiva de emprendimientos (RF-ADM-06, RF-ADM-07, RN-14)
  // ===========================================================================

  @Get('emprendimientos')
  @ApiOperation({ summary: 'Listar directorio administrativo de emprendimientos (RF-ADM-06)' })
  @ApiOkResponse({ type: PaginatedEmprendimientosAdminDto })
  listarEmprendimientos(
    @Query() query: ListarEmprendimientosAdminQueryDto,
  ): Promise<PaginatedEmprendimientosAdminDto> {
    return this.adminService.listarEmprendimientos(query);
  }

  @Post('emprendimientos/:emprendimientoId/moderar')
  @ApiOperation({
    summary: 'Ejecutar acción de moderación sobre un emprendimiento (RF-ADM-07, RN-14/RN-16)',
    description:
      'En una transacción: registra el evento inmutable en `moderaciones_emprendimiento`, actualiza `emprendimientos.estado` (`suspendido` o `activo`) y opcionalmente cierra el `reporteId` vinculado.',
  })
  @ApiParam({ name: 'emprendimientoId', format: 'uuid' })
  @ApiCreatedResponse({ type: ModeracionResponseDto })
  @ApiBadRequestResponse({ description: 'El reporte vinculado no pertenece a este emprendimiento' })
  @ApiNotFoundResponse({ description: 'Emprendimiento o reporte no encontrado' })
  moderarEmprendimiento(
    @CurrentUser() admin: UsuarioAutenticado,
    @Param('emprendimientoId', new ParseUUIDPipe()) emprendimientoId: string,
    @Body() dto: ModerarEmprendimientoDto,
  ): Promise<ModeracionResponseDto> {
    return this.adminService.moderarEmprendimiento(admin.id, emprendimientoId, dto);
  }

  // ===========================================================================
  // Dashboard y estadísticas (RF-ADM-08, RF-ADM-09, RN-15)
  // ===========================================================================

  @Get('estadisticas/resumen')
  @ApiOperation({
    summary: 'Resumen de estadísticas de la plataforma (RF-ADM-08)',
    description:
      'Devuelve totales de emprendimientos por estado, usuarios totales/verificados, productos activos y pedidos por estado.',
  })
  @ApiOkResponse({ type: EstadisticasResumenDto })
  estadisticasResumen(): Promise<EstadisticasResumenDto> {
    return this.adminService.obtenerEstadisticasResumen();
  }

  @Get('estadisticas/distribucion')
  @ApiOperation({
    summary: 'Distribución por categoría, geografía y top emprendimientos (RF-ADM-09)',
    description:
      'Conteo de emprendimientos activos por categoría y por provincia/cantón, más top emprendimientos por pedidos entregados.',
  })
  @ApiOkResponse({ type: EstadisticasDistribucionDto })
  estadisticasDistribucion(): Promise<EstadisticasDistribucionDto> {
    return this.adminService.obtenerEstadisticasDistribucion();
  }
}
