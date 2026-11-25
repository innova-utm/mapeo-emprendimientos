import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity({ name: 'productos_favoritos' })
@Unique('uq_favoritos_usuario_producto', ['usuarioId', 'productoId'])
export class ProductoFavorito {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'producto_id', type: 'uuid' })
  productoId: string;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.productosFavoritos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Producto, (producto) => producto.favoritos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;
}
