import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Canton } from './canton.entity.js';

@Entity({ name: 'provincias' })
export class Provincia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Canton, (canton) => canton.provincia)
  cantones: Relation<Canton[]>;
}
