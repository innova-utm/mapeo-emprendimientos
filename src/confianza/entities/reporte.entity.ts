import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EstadoReporte, MotivoReporte } from '../../common/enums/index.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../../pedidos/entities/pedido.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { ModeracionEmprendimiento } from './moderacion-emprendimiento.entity.js';

@Entity({ name: 'reportes' })
export class Reporte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reportado_por', type: 'uuid' })
  reportadoPor: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'pedido_id', type: 'uuid', nullable: true })
  pedidoId: string | null;

  @Column({
    name: 'motivo',
    type: 'enum',
    enum: MotivoReporte,
    enumName: 'motivo_reporte',
  })
  motivo: MotivoReporte;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoReporte,
    enumName: 'estado_reporte',
    default: EstadoReporte.PENDIENTE,
  })
  estado: EstadoReporte;

  @Column({ name: 'resuelto_por', type: 'uuid', nullable: true })
  resueltoPor: string | null;

  @Column({ name: 'resolucion', type: 'text', nullable: true })
  resolucion: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_resolucion', type: 'timestamptz', nullable: true })
  fechaResolucion: Date | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.reportesRealizados, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reportado_por' })
  reportadoPorUsuario: Relation<Usuario>;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.reportes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;

  @ManyToOne(() => Pedido, (pedido) => pedido.reportes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido | null>;

  @ManyToOne(() => Usuario, (usuario) => usuario.reportesResueltos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'resuelto_por' })
  resueltoPorUsuario: Relation<Usuario | null>;

  @OneToMany(() => ModeracionEmprendimiento, (moderacion) => moderacion.reporte)
  moderaciones: Relation<ModeracionEmprendimiento[]>;
}
