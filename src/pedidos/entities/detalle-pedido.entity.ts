import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PresentacionProducto } from '../../productos/entities/presentacion-producto.entity.js';
import { Pedido } from './pedido.entity.js';

@Entity({ name: 'detalles_pedido' })
export class DetallePedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @Column({ name: 'presentacion_id', type: 'uuid', nullable: true })
  presentacionId: string | null;

  @Column({ name: 'nombre_producto', type: 'varchar', length: 150 })
  nombreProducto: string;

  @Column({ name: 'nombre_presentacion', type: 'varchar', length: 100 })
  nombrePresentacion: string;

  @Column({ name: 'requiere_cotizacion', type: 'boolean', default: false })
  requiereCotizacion: boolean;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 12, scale: 2, nullable: true })
  precioUnitario: string | null;

  @Column({ name: 'cantidad', type: 'integer' })
  cantidad: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido>;

  @ManyToOne(() => PresentacionProducto, (presentacion) => presentacion.detallesPedido, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'presentacion_id' })
  presentacion: Relation<PresentacionProducto | null>;
}
