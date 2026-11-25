import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { Parroquia } from './parroquia.entity.js';
import { Provincia } from './provincia.entity.js';
import { Ubicacion } from './ubicacion.entity.js';

@Entity({ name: 'cantones' })
@Unique('uq_cantones_provincia_nombre', ['provinciaId', 'nombre'])
export class Canton {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provincia_id', type: 'uuid' })
  provinciaId: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @ManyToOne(() => Provincia, (provincia) => provincia.cantones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provincia_id' })
  provincia: Relation<Provincia>;

  @OneToMany(() => Parroquia, (parroquia) => parroquia.canton)
  parroquias: Relation<Parroquia[]>;

  @OneToMany(() => Ubicacion, (ubicacion) => ubicacion.canton)
  ubicaciones: Relation<Ubicacion[]>;
}
