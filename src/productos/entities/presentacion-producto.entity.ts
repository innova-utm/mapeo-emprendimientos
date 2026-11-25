import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EstadoRegistro } from '../../common/enums/index.js';
import { DetallePedido } from '../../pedidos/entities/detalle-pedido.entity.js';
import { Producto } from './producto.entity.js';

@Entity({ name: 'presentaciones_producto' })
export class PresentacionProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'producto_id', type: 'uuid' })
  productoId: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'precio', type: 'numeric', precision: 12, scale: 2, nullable: true })
  precio: string | null;

  @Column({ name: 'requiere_cotizacion', type: 'boolean', default: false })
  requiereCotizacion: boolean;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoRegistro,
    enumName: 'estado_registro',
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  @ManyToOne(() => Producto, (producto) => producto.presentaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @OneToMany(() => DetallePedido, (detalle) => detalle.presentacion)
  detallesPedido: Relation<DetallePedido[]>;
}
