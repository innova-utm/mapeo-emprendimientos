import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoRegistro } from '../common/enums/index.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(CategoriaEmprendimiento)
    private readonly categoriaEmprendimientoRepo: Repository<CategoriaEmprendimiento>,
    @InjectRepository(CategoriaProducto)
    private readonly categoriaProductoRepo: Repository<CategoriaProducto>,
    @InjectRepository(DocumentoLegal)
    private readonly documentoLegalRepo: Repository<DocumentoLegal>,
  ) {}

  async findCategoriasEmprendimientoActivas(): Promise<CategoriaEmprendimiento[]> {
    return this.categoriaEmprendimientoRepo.find({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  async findCategoriasProductoActivas(): Promise<CategoriaProducto[]> {
    return this.categoriaProductoRepo.find({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  async findDocumentosLegalesActivos(): Promise<DocumentoLegal[]> {
    return this.documentoLegalRepo.find({
      where: { estado: EstadoRegistro.ACTIVO },
      order: { tipo: 'ASC', version: 'DESC' },
    });
  }
}
