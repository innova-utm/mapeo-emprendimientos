import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Emprendimiento } from './emprendimiento.entity.js';

@Entity({ name: 'redes_sociales_emprendimiento' })
export class RedSocialEmprendimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'plataforma', type: 'varchar', length: 50 })
  plataforma: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.redesSociales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;
}
