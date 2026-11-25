import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type UsuarioAutenticado } from '../common/auth/index.js';
import { CreateReporteDto, ListarMisReportesQueryDto } from './dto/reporte.dto.js';
import { PaginatedReportesDto, ReporteResponseDto } from './dto/reporte-response.dto.js';
import { ReportesService } from './reportes.service.js';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear reporte ciudadano sobre un emprendimiento (RF-CON-07)',
    description:
      'Registra un ticket en estado `pendiente`. Si se envía `pedidoId`, valida que el pedido pertenezca al usuario autenticado y al emprendimiento reportado.',
  })
  @ApiCreatedResponse({ type: ReporteResponseDto })
  @ApiBadRequestResponse({ description: 'El pedido no corresponde al emprendimiento reportado' })
  @ApiForbiddenResponse({ description: 'El pedido indicado no pertenece al usuario autenticado' })
  @ApiNotFoundResponse({ description: 'Emprendimiento o pedido no encontrado' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateReporteDto,
  ): Promise<ReporteResponseDto> {
    return this.reportesService.crear(usuario.id, dto);
  }

  @Get('mis-reportes')
  @ApiOperation({ summary: 'Historial paginado de mis reportes enviados (RF-CON-08)' })
  @ApiOkResponse({ type: PaginatedReportesDto })
  listarMisReportes(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() query: ListarMisReportesQueryDto,
  ): Promise<PaginatedReportesDto> {
    return this.reportesService.listarMisReportes(usuario.id, query);
  }
}
