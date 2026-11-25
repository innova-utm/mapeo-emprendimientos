import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmprendimientoFavorito } from '../confianza/entities/emprendimiento-favorito.entity.js';
import { ProductoFavorito } from '../confianza/entities/producto-favorito.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Producto } from '../productos/entities/producto.entity.js';
import { FavoritosController } from './favoritos.controller.js';
import { FavoritosService } from './favoritos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmprendimientoFavorito, ProductoFavorito, Emprendimiento, Producto]),
  ],
  controllers: [FavoritosController],
  providers: [FavoritosService],
  exports: [FavoritosService],
})
export class FavoritosModule {}
