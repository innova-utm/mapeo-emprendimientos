import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../../pedidos/entities/pedido.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity({ name: 'resenas' })
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid', unique: true })
  pedidoId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'valoracion', type: 'integer' })
  valoracion: number;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @OneToOne(() => Pedido, (pedido) => pedido.resena, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'pedido_id', referencedColumnName: 'id' },
    { name: 'usuario_id', referencedColumnName: 'usuarioId' },
    { name: 'emprendimiento_id', referencedColumnName: 'emprendimientoId' },
  ])
  pedido: Relation<Pedido>;

  @ManyToOne(() => Usuario, (usuario) => usuario.resenas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.resenas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;
}
