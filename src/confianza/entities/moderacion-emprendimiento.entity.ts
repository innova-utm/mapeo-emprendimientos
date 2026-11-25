import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AccionModeracion } from '../../common/enums/index.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Reporte } from './reporte.entity.js';

@Entity({ name: 'moderaciones_emprendimiento' })
export class ModeracionEmprendimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'administrador_id', type: 'uuid' })
  administradorId: string;

  @Column({ name: 'reporte_id', type: 'uuid', nullable: true })
  reporteId: string | null;

  @Column({
    name: 'accion',
    type: 'enum',
    enum: AccionModeracion,
    enumName: 'accion_moderacion',
  })
  accion: AccionModeracion;

  @Column({ name: 'motivo', type: 'text' })
  motivo: string;

  @Column({ name: 'fecha_moderacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaModeracion: Date;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.moderaciones, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;

  @ManyToOne(() => Usuario, (usuario) => usuario.moderacionesRealizadas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'administrador_id' })
  administrador: Relation<Usuario>;

  @ManyToOne(() => Reporte, (reporte) => reporte.moderaciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reporte_id' })
  reporte: Relation<Reporte | null>;
}
