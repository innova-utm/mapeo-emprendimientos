import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Emprendimiento } from './emprendimiento.entity.js';

@Entity({ name: 'imagenes_emprendimiento' })
export class ImagenEmprendimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'es_principal', type: 'boolean', default: false })
  esPrincipal: boolean;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.imagenes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;
}
