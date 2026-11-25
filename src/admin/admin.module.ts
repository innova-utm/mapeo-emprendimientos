import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeracionEmprendimiento } from '../confianza/entities/moderacion-emprendimiento.entity.js';
import { Reporte } from '../confianza/entities/reporte.entity.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { Producto } from '../productos/entities/producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoriaEmprendimiento,
      CategoriaProducto,
      DocumentoLegal,
      Reporte,
      ModeracionEmprendimiento,
      Emprendimiento,
      Usuario,
      Producto,
      Pedido,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
