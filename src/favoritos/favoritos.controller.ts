import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type UsuarioAutenticado } from '../common/auth/index.js';
import {
  EmprendimientoFavoritoResponseDto,
  ProductoFavoritoResponseDto,
} from './dto/favorito-response.dto.js';
import { FavoritosService } from './favoritos.service.js';

@ApiTags('Favoritos')
@ApiBearerAuth()
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Post('emprendimientos/:emprendimientoId')
  @ApiOperation({ summary: 'Agregar emprendimiento a favoritos (RF-CON-01)' })
  @ApiParam({ name: 'emprendimientoId', format: 'uuid' })
  @ApiCreatedResponse({ type: EmprendimientoFavoritoResponseDto })
  @ApiNotFoundResponse({ description: 'Emprendimiento no encontrado' })
  @ApiConflictResponse({ description: 'El emprendimiento ya está en favoritos' })
  agregarEmprendimiento(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('emprendimientoId', new ParseUUIDPipe()) emprendimientoId: string,
  ): Promise<EmprendimientoFavoritoResponseDto> {
    return this.favoritosService.agregarEmprendimiento(usuario.id, emprendimientoId);
  }

  @Delete('emprendimientos/:emprendimientoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar emprendimiento de favoritos (RF-CON-01)' })
  @ApiParam({ name: 'emprendimientoId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Emprendimiento eliminado de favoritos' })
  eliminarEmprendimiento(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('emprendimientoId', new ParseUUIDPipe()) emprendimientoId: string,
  ): Promise<void> {
    return this.favoritosService.eliminarEmprendimiento(usuario.id, emprendimientoId);
  }

  @Get('emprendimientos')
  @ApiOperation({
    summary: 'Listar emprendimientos favoritos del usuario (RF-CON-02)',
    description:
      'Incluye el `estado` actual de cada emprendimiento para mostrar si fue pausado o suspendido.',
  })
  @ApiOkResponse({ type: [EmprendimientoFavoritoResponseDto] })
  listarEmprendimientos(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<EmprendimientoFavoritoResponseDto[]> {
    return this.favoritosService.listarEmprendimientos(usuario.id);
  }

  @Post('productos/:productoId')
  @ApiOperation({ summary: 'Agregar producto a favoritos (RF-CON-01)' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiCreatedResponse({ type: ProductoFavoritoResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'El producto ya está en favoritos' })
  agregarProducto(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<ProductoFavoritoResponseDto> {
    return this.favoritosService.agregarProducto(usuario.id, productoId);
  }

  @Delete('productos/:productoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar producto de favoritos (RF-CON-01)' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Producto eliminado de favoritos' })
  eliminarProducto(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<void> {
    return this.favoritosService.eliminarProducto(usuario.id, productoId);
  }

  @Get('productos')
  @ApiOperation({
    summary: 'Listar productos favoritos del usuario (RF-CON-03)',
    description:
      'Incluye el `estado` actual de cada producto y de su emprendimiento propietario.',
  })
  @ApiOkResponse({ type: [ProductoFavoritoResponseDto] })
  listarProductos(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ProductoFavoritoResponseDto[]> {
    return this.favoritosService.listarProductos(usuario.id);
  }
}
