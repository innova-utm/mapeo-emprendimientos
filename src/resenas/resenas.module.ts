import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resena } from '../confianza/entities/resena.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import { EmprendimientoResenasController, ResenasController } from './resenas.controller.js';
import { ResenasService } from './resenas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Resena, Pedido, Emprendimiento])],
  controllers: [ResenasController, EmprendimientoResenasController],
  providers: [ResenasService],
  exports: [ResenasService],
})
export class ResenasModule {}
