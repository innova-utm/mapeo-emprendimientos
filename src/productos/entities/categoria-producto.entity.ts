import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { EstadoRegistro } from '../../common/enums/index.js';
import { Producto } from './producto.entity.js';

@Entity({ name: 'categorias_producto' })
export class CategoriaProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
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

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Relation<Producto[]>;
}
