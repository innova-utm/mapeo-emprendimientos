import { Public } from '../common/auth/index.js';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service.js';
import { CategoriaCatalogoDto, DocumentoLegalDto } from './dto/catalogo-response.dto.js';

@ApiTags('Catálogos')
@Public()
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('categorias-emprendimiento')
  @ApiOperation({
    summary: 'Listar categorías activas de emprendimientos',
    description: 'Retorna todas las categorías de emprendimientos con estado activo ordenadas alfabéticamente.',
  })
  @ApiOkResponse({
    description: 'Lista de categorías activas de emprendimientos',
    type: CategoriaCatalogoDto,
    isArray: true,
  })
  async getCategoriasEmprendimiento(): Promise<CategoriaCatalogoDto[]> {
    return this.catalogosService.findCategoriasEmprendimientoActivas();
  }

  @Get('categorias-producto')
  @ApiOperation({
    summary: 'Listar categorías activas de productos',
    description: 'Retorna todas las categorías de productos con estado activo ordenadas alfabéticamente.',
  })
  @ApiOkResponse({
    description: 'Lista de categorías activas de productos',
    type: CategoriaCatalogoDto,
    isArray: true,
  })
  async getCategoriasProducto(): Promise<CategoriaCatalogoDto[]> {
    return this.catalogosService.findCategoriasProductoActivas();
  }

  @Get('documentos-legales')
  @ApiOperation({
    summary: 'Listar documentos legales activos',
    description: 'Retorna los términos, políticas de privacidad y demás documentos legales vigentes.',
  })
  @ApiOkResponse({
    description: 'Lista de documentos legales activos',
    type: DocumentoLegalDto,
    isArray: true,
  })
  async getDocumentosLegales(): Promise<DocumentoLegalDto[]> {
    return this.catalogosService.findDocumentosLegalesActivos();
  }
}
