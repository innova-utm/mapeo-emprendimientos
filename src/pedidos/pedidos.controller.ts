import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import {
  ActualizarEstadoPedidoDto,
  CrearPedidoDto,
  ListarPedidosQueryDto,
} from './dto/pedido.dto.js';
import {
  PaginatedPedidosDto,
  PedidoCreadoResponseDto,
  PedidoResponseDto,
} from './dto/pedido-response.dto.js';
import { PedidosService } from './pedidos.service.js';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @Roles('consumidor', 'emprendedor')
  @ApiOperation({
    summary: 'Crear pedidos desde el carrito (RF-PED-03/04)',
    description:
      'Divide el carrito en un pedido por emprendimiento (RN-08) dentro de una transacción. ' +
      'Los precios se toman de BD y se guardan como snapshot. Devuelve un `whatsappUrl` por pedido y el aviso anti-estafas.',
  })
  @ApiCreatedResponse({ type: [PedidoCreadoResponseDto] })
  @ApiBadRequestResponse({ description: 'Presentación/producto/emprendimiento inexistente o no activo' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CrearPedidoDto,
  ): Promise<PedidoCreadoResponseDto[]> {
    return this.pedidosService.crear(usuario.id, dto);
  }

  @Get('mis-pedidos')
  @ApiOperation({ summary: 'Historial de mis pedidos como comprador (RF-PED-05)' })
  @ApiOkResponse({ type: PaginatedPedidosDto })
  misPedidos(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() query: ListarPedidosQueryDto,
  ): Promise<PaginatedPedidosDto> {
    return this.pedidosService.listarMisPedidos(usuario.id, query);
  }

  @Get('recibidos')
  @Roles('emprendedor')
  @ApiOperation({ summary: 'Pedidos recibidos por mi emprendimiento (RF-PED-06)' })
  @ApiOkResponse({ type: PaginatedPedidosDto })
  recibidos(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() query: ListarPedidosQueryDto,
  ): Promise<PaginatedPedidosDto> {
    return this.pedidosService.listarRecibidos(usuario.id, query);
  }

  @Get(':pedidoId')
  @ApiOperation({ summary: 'Detalle de pedido (comprador o titular receptor)' })
  @ApiParam({ name: 'pedidoId', format: 'uuid' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiForbiddenResponse({ description: 'No eres el comprador ni el titular receptor' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  detalle(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('pedidoId', new ParseUUIDPipe()) pedidoId: string,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.obtenerDetalle(usuario.id, pedidoId);
  }

  @Patch(':pedidoId/estado')
  @Roles('emprendedor')
  @ApiOperation({
    summary: 'Actualizar estado del pedido (RF-PED-07)',
    description:
      'nuevo→confirmado|cancelado; confirmado→preparando|cancelado; preparando→entregado|cancelado; entregado y cancelado son terminales.',
  })
  @ApiParam({ name: 'pedidoId', format: 'uuid' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiBadRequestResponse({ description: 'Transición no permitida' })
  @ApiForbiddenResponse({ description: 'El pedido no pertenece a tu emprendimiento' })
  actualizarEstado(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('pedidoId', new ParseUUIDPipe()) pedidoId: string,
    @Body() dto: ActualizarEstadoPedidoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.actualizarEstado(usuario.id, pedidoId, dto.estado);
  }

  @Patch(':pedidoId/confirmar-recepcion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar recepción (solo el comprador) (RF-PED-08)' })
  @ApiParam({ name: 'pedidoId', format: 'uuid' })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiBadRequestResponse({ description: 'El pedido está cancelado' })
  @ApiForbiddenResponse({ description: 'No eres el comprador del pedido' })
  confirmarRecepcion(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('pedidoId', new ParseUUIDPipe()) pedidoId: string,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.confirmarRecepcion(usuario.id, pedidoId);
  }
}
