import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { CanalVerificacion, PropositoVerificacion } from '../../common/enums/index.js';
import { Usuario } from './usuario.entity.js';

@Entity({ name: 'codigos_verificacion' })
export class CodigoVerificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ name: 'destino', type: 'varchar', length: 255 })
  destino: string;

  @Column({
    name: 'canal',
    type: 'enum',
    enum: CanalVerificacion,
    enumName: 'canal_verificacion',
  })
  canal: CanalVerificacion;

  @Column({
    name: 'proposito',
    type: 'enum',
    enum: PropositoVerificacion,
    enumName: 'proposito_verificacion',
  })
  proposito: PropositoVerificacion;

  @Column({ name: 'codigo_hash', type: 'varchar', length: 255 })
  codigoHash: string;

  @Column({ name: 'intentos', type: 'integer', default: 0 })
  intentos: number;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz' })
  fechaExpiracion: Date;

  @Column({ name: 'fecha_utilizacion', type: 'timestamptz', nullable: true })
  fechaUtilizacion: Date | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.codigosVerificacion, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario | null>;
}
