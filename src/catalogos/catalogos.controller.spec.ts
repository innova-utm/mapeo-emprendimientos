import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EstadoRegistro } from '../common/enums/index.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { CatalogosController } from './catalogos.controller.js';
import { CatalogosService } from './catalogos.service.js';

describe('CatalogosController', () => {
  let controller: CatalogosController;
  let categoriaEmprendimientoFind: ReturnType<typeof vi.fn>;
  let categoriaProductoFind: ReturnType<typeof vi.fn>;
  let documentoLegalFind: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    categoriaEmprendimientoFind = vi.fn();
    categoriaProductoFind = vi.fn();
    documentoLegalFind = vi.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CatalogosController],
      providers: [
        CatalogosService,
        {
          provide: getRepositoryToken(CategoriaEmprendimiento),
          useValue: { find: categoriaEmprendimientoFind },
        },
        {
          provide: getRepositoryToken(CategoriaProducto),
          useValue: { find: categoriaProductoFind },
        },
        {
          provide: getRepositoryToken(DocumentoLegal),
          useValue: { find: documentoLegalFind },
        },
      ],
    }).compile();

    controller = moduleRef.get<CatalogosController>(CatalogosController);
  });

  it('debe retornar solo categorías activas de emprendimientos', async () => {
    const mockData = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        nombre: 'Gastronomía y Comida Típica',
        descripcion: 'Platos tradicionales',
        estado: EstadoRegistro.ACTIVO,
      },
    ];
    categoriaEmprendimientoFind.mockResolvedValueOnce(mockData);

    const result = await controller.getCategoriasEmprendimiento();

    expect(categoriaEmprendimientoFind).toHaveBeenCalledWith({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
    expect(result).toEqual(mockData);
  });

  it('debe retornar solo categorías activas de productos', async () => {
    const mockData = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        nombre: 'Alimentos Preparados',
        descripcion: 'Comida lista',
        estado: EstadoRegistro.ACTIVO,
      },
    ];
    categoriaProductoFind.mockResolvedValueOnce(mockData);

    const result = await controller.getCategoriasProducto();

    expect(categoriaProductoFind).toHaveBeenCalledWith({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
    expect(result).toEqual(mockData);
  });

  it('debe retornar solo documentos legales activos', async () => {
    const mockData = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        nombre: 'Términos y Condiciones de Uso',
        tipo: 'terminos',
        version: '1.0',
        contenidoUrl: 'https://plataformamapeo.ec/legal/terminos-v1.0',
        estado: EstadoRegistro.ACTIVO,
        fechaPublicacion: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];
    documentoLegalFind.mockResolvedValueOnce(mockData);

    const result = await controller.getDocumentosLegales();

    expect(documentoLegalFind).toHaveBeenCalledWith({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { tipo: 'ASC', version: 'DESC' },
    });
    expect(result).toEqual(mockData);
  });
});
