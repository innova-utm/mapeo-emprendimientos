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
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import type { ArchivoSubido } from '../storage/storage.interface.js';
import {
  CreatePresentacionDto,
  CreateProductoDto,
  ListarProductosQueryDto,
  SubirImagenProductoDto,
  UpdatePresentacionDto,
  UpdateProductoDto,
} from './dto/producto.dto.js';
import {
  ImagenProductoResponseDto,
  PaginatedProductosDto,
  PresentacionResponseDto,
  ProductoResponseDto,
} from './dto/producto-response.dto.js';
import { ProductosService } from './productos.service.js';

@ApiTags('Productos (titular)')
@ApiBearerAuth()
@Roles('emprendedor')
@Controller('emprendimientos/mi-emprendimiento/productos')
export class ProductosTitularController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto (RF-CAT-01)' })
  @ApiCreatedResponse({ type: ProductoResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos o categoría inactiva' })
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CreateProductoDto,
  ): Promise<ProductoResponseDto> {
    return this.productosService.crear(usuario.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar mis productos (activos e inactivos) con presentaciones e imágenes (RF-CAT-02)',
  })
  @ApiOkResponse({ type: [ProductoResponseDto] })
  listar(@CurrentUser() usuario: UsuarioAutenticado): Promise<ProductoResponseDto[]> {
    return this.productosService.listarPropios(usuario.id);
  }

  @Patch(':productoId')
  @ApiOperation({
    summary: 'Editar producto o cambiar estado activo/inactivo (RF-CAT-03)',
    description: 'El borrado es lógico: use `estado: "inactivo"`.',
  })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiOkResponse({ type: ProductoResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no pertenece a tu emprendimiento' })
  actualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Body() dto: UpdateProductoDto,
  ): Promise<ProductoResponseDto> {
    return this.productosService.actualizar(usuario.id, productoId, dto);
  }

  // --- Presentaciones -------------------------------------------------------

  @Post(':productoId/presentaciones')
  @ApiOperation({
    summary: 'Crear presentación (RF-CAT-04)',
    description:
      'Si `requiereCotizacion = false`, `precio` es obligatorio y >= 0. Si es `true`, el precio es opcional.',
  })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiCreatedResponse({ type: PresentacionResponseDto })
  @ApiBadRequestResponse({ description: 'Precio inconsistente con requiereCotizacion' })
  crearPresentacion(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Body() dto: CreatePresentacionDto,
  ): Promise<PresentacionResponseDto> {
    return this.productosService.crearPresentacion(usuario.id, productoId, dto);
  }

  @Patch(':productoId/presentaciones/:presentacionId')
  @ApiOperation({ summary: 'Editar presentación (RF-CAT-05)' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiParam({ name: 'presentacionId', format: 'uuid' })
  @ApiOkResponse({ type: PresentacionResponseDto })
  actualizarPresentacion(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('presentacionId', new ParseUUIDPipe()) presentacionId: string,
    @Body() dto: UpdatePresentacionDto,
  ): Promise<PresentacionResponseDto> {
    return this.productosService.actualizarPresentacion(usuario.id, productoId, presentacionId, dto);
  }

  @Delete(':productoId/presentaciones/:presentacionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar presentación (borrado lógico)' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiParam({ name: 'presentacionId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Presentación marcada como inactiva' })
  eliminarPresentacion(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('presentacionId', new ParseUUIDPipe()) presentacionId: string,
  ): Promise<void> {
    return this.productosService.eliminarPresentacion(usuario.id, productoId, presentacionId);
  }

  // --- Imágenes -------------------------------------------------------------

  @Post(':productoId/imagenes')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir imagen de producto (RF-CAT-06)',
    description: 'JPEG, PNG o WebP (máx. 5 MB) mediante multipart/form-data.',
  })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        esPrincipal: { type: 'boolean', default: false },
      },
    },
  })
  @ApiCreatedResponse({ type: ImagenProductoResponseDto })
  subirImagen(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @UploadedFile() file: ArchivoSubido | undefined,
    @Body() dto: SubirImagenProductoDto,
  ): Promise<ImagenProductoResponseDto> {
    return this.productosService.subirImagen(usuario.id, productoId, file, dto.esPrincipal ?? false);
  }

  @Delete(':productoId/imagenes/:imagenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar imagen de producto (RF-CAT-06)' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiParam({ name: 'imagenId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Imagen eliminada' })
  eliminarImagen(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<void> {
    return this.productosService.eliminarImagen(usuario.id, productoId, imagenId);
  }

  @Patch(':productoId/imagenes/:imagenId/principal')
  @ApiOperation({
    summary: 'Marcar imagen principal (RF-CAT-07)',
    description: 'Transacción que desmarca las demás antes de marcar la elegida.',
  })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiParam({ name: 'imagenId', format: 'uuid' })
  @ApiOkResponse({ type: ImagenProductoResponseDto })
  marcarPrincipal(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<ImagenProductoResponseDto> {
    return this.productosService.marcarImagenPrincipal(usuario.id, productoId, imagenId);
  }
}

@ApiTags('Productos (público)')
@Controller('productos')
export class ProductosPublicController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listado público paginado de productos activos (RF-CAT-08)',
    description:
      'Solo productos `activo` de emprendimientos `activo`. Filtros: q, emprendimientoId, categoriaId, precioMin, precioMax.',
  })
  @ApiOkResponse({ type: PaginatedProductosDto })
  listar(@Query() query: ListarProductosQueryDto): Promise<PaginatedProductosDto> {
    return this.productosService.listarPublicos(query);
  }

  @Get(':productoId')
  @Public()
  @ApiOperation({ summary: 'Detalle público de producto con presentaciones activas e imágenes' })
  @ApiParam({ name: 'productoId', format: 'uuid' })
  @ApiOkResponse({ type: ProductoResponseDto })
  @ApiNotFoundResponse({ description: 'Producto o emprendimiento no activos' })
  detalle(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<ProductoResponseDto> {
    return this.productosService.obtenerDetallePublico(productoId);
  }
}
