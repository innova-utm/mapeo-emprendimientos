import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { EstadoRegistro } from '../../common/enums/index.js';
import { Emprendimiento } from './emprendimiento.entity.js';

@Entity({ name: 'categorias_emprendimiento' })
export class CategoriaEmprendimiento {
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

  @OneToMany(() => Emprendimiento, (emprendimiento) => emprendimiento.categoria)
  emprendimientos: Relation<Emprendimiento[]>;
}
