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
import { CurrentUser, Public, type UsuarioAutenticado } from '../common/auth/index.js';
import { CreateResenaDto, ListarResenasQueryDto, UpdateResenaDto } from './dto/resena.dto.js';
import { PaginatedResenasDto, ResenaResponseDto } from './dto/resena-response.dto.js';
import { ResenasService } from './resenas.service.js';

@ApiTags('Reseñas')
@ApiBearerAuth()
@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear reseña verificada desde un pedido (RF-CON-04, RN-13/RN-14)',
    description:
      'Requiere que el pedido pertenezca al usuario autenticado, esté en estado `entregado` o con recepción confirmada, y no tenga una reseña previa.',
  })
  @ApiCreatedResponse({ type: ResenaResponseDto })
  @ApiBadRequestResponse({ description: 'El pedido aún no está entregado ni confirmado' })
  @ApiForbiddenResponse({ description: 'El pedido no pertenece al usuario autenticado' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  @ApiConflictResponse({ description: 'Ya existe una reseña para este pedido' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateResenaDto,
  ): Promise<ResenaResponseDto> {
    return this.resenasService.crear(usuario.id, dto);
  }

  @Patch(':resenaId')
  @ApiOperation({ summary: 'Editar mi reseña (RF-CON-05)' })
  @ApiParam({ name: 'resenaId', format: 'uuid' })
  @ApiOkResponse({ type: ResenaResponseDto })
  @ApiForbiddenResponse({ description: 'Solo el autor puede editar esta reseña' })
  @ApiNotFoundResponse({ description: 'Reseña no encontrada' })
  actualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('resenaId', new ParseUUIDPipe()) resenaId: string,
    @Body() dto: UpdateResenaDto,
  ): Promise<ResenaResponseDto> {
    return this.resenasService.actualizar(usuario.id, resenaId, dto);
  }
}

@ApiTags('Reseñas')
@Controller('emprendimientos')
export class EmprendimientoResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Get(':emprendimientoId/resenas')
  @Public()
  @ApiOperation({
    summary: 'Listar reseñas públicas de un emprendimiento (RF-CON-06)',
    description: 'Devuelve las reseñas paginadas junto con el promedio de valoración y total.',
  })
  @ApiParam({ name: 'emprendimientoId', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedResenasDto })
  @ApiNotFoundResponse({ description: 'Emprendimiento no encontrado' })
  listarPorEmprendimiento(
    @Param('emprendimientoId', new ParseUUIDPipe()) emprendimientoId: string,
    @Query() query: ListarResenasQueryDto,
  ): Promise<PaginatedResenasDto> {
    return this.resenasService.listarPorEmprendimiento(emprendimientoId, query);
  }
}
