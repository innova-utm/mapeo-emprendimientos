import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Point,
  type Relation,
} from 'typeorm';
import { EstadoRegistro } from '../../common/enums/index.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Canton } from './canton.entity.js';
import { Parroquia } from './parroquia.entity.js';

@Entity({ name: 'ubicaciones' })
export class Ubicacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emprendimiento_id', type: 'uuid' })
  emprendimientoId: string;

  @Column({ name: 'canton_id', type: 'uuid' })
  cantonId: string;

  @Column({ name: 'parroquia_id', type: 'uuid', nullable: true })
  parroquiaId: string | null;

  @Column({ name: 'nombre_sucursal', type: 'varchar', length: 150, nullable: true })
  nombreSucursal: string | null;

  @Column({ name: 'direccion', type: 'text' })
  direccion: string;

  @Column({ name: 'referencia', type: 'text', nullable: true })
  referencia: string | null;

  @Column({ name: 'horario_texto', type: 'varchar', length: 150, nullable: true })
  horarioTexto: string | null;

  @Column({
    name: 'coordenadas',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  coordenadas: Point;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoRegistro,
    enumName: 'estado_registro',
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @ManyToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.ubicaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emprendimiento_id' })
  emprendimiento: Relation<Emprendimiento>;

  @ManyToOne(() => Canton, (canton) => canton.ubicaciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'canton_id' })
  canton: Relation<Canton>;

  @ManyToOne(() => Parroquia, (parroquia) => parroquia.ubicaciones, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    { name: 'parroquia_id', referencedColumnName: 'id' },
    { name: 'canton_id', referencedColumnName: 'cantonId' },
  ])
  parroquia: Relation<Parroquia | null>;
}
