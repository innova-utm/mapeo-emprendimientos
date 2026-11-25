import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity({ name: 'emprendimientos_favoritos' })
@Unique('uq_favoritos_usuario_emprendimiento', ['usuarioId', 'emprendimientoId'])
export class EmprendimientoFavorito {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.emprendimientosFavoritos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.favoritos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;
}
