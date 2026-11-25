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
import { Canton } from './canton.entity.js';
import { Ubicacion } from './ubicacion.entity.js';

@Entity({ name: 'parroquias' })
@Unique('uq_parroquias_canton_nombre', ['cantonId', 'nombre'])
@Unique('uq_parroquias_id_canton', ['id', 'cantonId'])
export class Parroquia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'canton_id', type: 'uuid' })
  cantonId: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'tipo', type: 'varchar', length: 20 })
  tipo: string;

  @ManyToOne(() => Canton, (canton) => canton.parroquias, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'canton_id' })
  canton: Relation<Canton>;

  @OneToMany(() => Ubicacion, (ubicacion) => ubicacion.parroquia)
  ubicaciones: Relation<Ubicacion[]>;
}
