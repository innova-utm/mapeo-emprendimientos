import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity({ name: 'imagenes_producto' })
export class ImagenProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'producto_id', type: 'uuid' })
  productoId: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'es_principal', type: 'boolean', default: false })
  esPrincipal: boolean;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Producto, (producto) => producto.imagenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;
}
