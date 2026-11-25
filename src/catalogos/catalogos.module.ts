import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { CatalogosController } from './catalogos.controller.js';
import { CatalogosService } from './catalogos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoriaEmprendimiento, CategoriaProducto, DocumentoLegal]),
  ],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}
