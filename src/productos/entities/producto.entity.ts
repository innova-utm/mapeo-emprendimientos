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
import { ProductoFavorito } from '../../confianza/entities/producto-favorito.entity.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { CategoriaProducto } from './categoria-producto.entity.js';
import { ImagenProducto } from './imagen-producto.entity.js';
import { PresentacionProducto } from './presentacion-producto.entity.js';

@Entity({ name: 'productos' })
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'categoria_id', type: 'uuid' })
  categoriaId: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoRegistro,
    enumName: 'estado_registro',
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.productos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;

  @ManyToOne(() => CategoriaProducto, (categoria) => categoria.productos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<CategoriaProducto>;

  @OneToMany(() => PresentacionProducto, (presentacion) => presentacion.producto)
  presentaciones: Relation<PresentacionProducto[]>;

  @OneToMany(() => ImagenProducto, (imagen) => imagen.producto)
  imagenes: Relation<ImagenProducto[]>;

  @OneToMany(() => ProductoFavorito, (favorito) => favorito.producto)
  favoritos: Relation<ProductoFavorito[]>;
}
