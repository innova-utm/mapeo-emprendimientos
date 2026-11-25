import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { PresentacionProducto } from '../productos/entities/presentacion-producto.entity.js';
import { DetallePedido } from './entities/detalle-pedido.entity.js';
import { Pedido } from './entities/pedido.entity.js';
import { PedidosController } from './pedidos.controller.js';
import { PedidosService } from './pedidos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, DetallePedido, PresentacionProducto, Emprendimiento])],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
