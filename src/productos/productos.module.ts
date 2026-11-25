import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { CategoriaProducto } from './entities/categoria-producto.entity.js';
import { ImagenProducto } from './entities/imagen-producto.entity.js';
import { PresentacionProducto } from './entities/presentacion-producto.entity.js';
import { Producto } from './entities/producto.entity.js';
import { ProductosPublicController, ProductosTitularController } from './productos.controller.js';
import { ProductosService } from './productos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      PresentacionProducto,
      ImagenProducto,
      CategoriaProducto,
      Emprendimiento,
    ]),
  ],
  controllers: [ProductosTitularController, ProductosPublicController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
