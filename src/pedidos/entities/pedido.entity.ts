import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { EstadoPedido } from '../../common/enums/index.js';
import { Reporte } from '../../confianza/entities/reporte.entity.js';
import { Resena } from '../../confianza/entities/resena.entity.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { DetallePedido } from './detalle-pedido.entity.js';

@Entity({ name: 'pedidos' })
@Unique('uq_pedidos_integridad_resena', ['id', 'usuarioId', 'emprendimientoId'])
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'codigo_pedido',
    type: 'varchar',
    length: 20,
    unique: true,
    insert: false,
    update: false,
  })
  codigoPedido: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'nombre_emprendimiento_snapshot', type: 'varchar', length: 150 })
  nombreEmprendimientoSnapshot: string;

  @Column({ name: 'whatsapp_emprendimiento_snapshot', type: 'varchar', length: 20 })
  whatsappEmprendimientoSnapshot: string;

  @Column({ name: 'nota_comprador', type: 'text', nullable: true })
  notaComprador: string | null;

  @Column({ name: 'total_referencial', type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalReferencial: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoPedido,
    enumName: 'estado_pedido',
    default: EstadoPedido.NUEVO,
  })
  estado: EstadoPedido;

  @Column({ name: 'comprador_confirmo_recepcion', type: 'boolean', default: false })
  compradorConfirmoRecepcion: boolean;

  @Column({ name: 'fecha_confirmacion_comprador', type: 'timestamptz', nullable: true })
  fechaConfirmacionComprador: Date | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.pedidos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido)
  detalles: Relation<DetallePedido[]>;

  @OneToOne(() => Resena, (resena) => resena.pedido)
  resena: Relation<Resena | null>;

  @OneToMany(() => Reporte, (reporte) => reporte.pedido)
  reportes: Relation<Reporte[]>;
}
