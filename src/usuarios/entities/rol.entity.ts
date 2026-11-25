import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';

@Entity({ name: 'roles' })
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50, unique: true })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Relation<Usuario[]>;
}
