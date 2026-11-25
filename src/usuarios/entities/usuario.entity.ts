import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EstadoUsuario } from '../../common/enums/index.js';
import { EmprendimientoFavorito } from '../../confianza/entities/emprendimiento-favorito.entity.js';
import { ModeracionEmprendimiento } from '../../confianza/entities/moderacion-emprendimiento.entity.js';
import { ProductoFavorito } from '../../confianza/entities/producto-favorito.entity.js';
import { Reporte } from '../../confianza/entities/reporte.entity.js';
import { Resena } from '../../confianza/entities/resena.entity.js';
import { Emprendimiento } from '../../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../../pedidos/entities/pedido.entity.js';
import { AceptacionDocumento } from './aceptacion-documento.entity.js';
import { CodigoVerificacion } from './codigo-verificacion.entity.js';
import { Rol } from './rol.entity.js';

@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rol_id', type: 'uuid' })
  rolId: string;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  nombres: string;

  @Column({ name: 'apellidos', type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20, unique: true })
  telefono: string;

  @Column({ name: 'telefono_verificado', type: 'boolean', default: false })
  telefonoVerificado: boolean;

  @Column({ name: 'correo', type: 'varchar', length: 255, unique: true, nullable: true })
  correo: string | null;

  @Column({ name: 'correo_verificado', type: 'boolean', default: false })
  correoVerificado: boolean;

  @Column({ name: 'contrasena', type: 'varchar', length: 255, nullable: true })
  contrasena: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoUsuario,
    enumName: 'estado_usuario',
    default: EstadoUsuario.ACTIVO,
  })
  estado: EstadoUsuario;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rol_id' })
  rol: Relation<Rol>;

  @OneToMany(() => CodigoVerificacion, (codigo) => codigo.usuario)
  codigosVerificacion: Relation<CodigoVerificacion[]>;

  @OneToMany(() => AceptacionDocumento, (aceptacion) => aceptacion.usuario)
  aceptacionesDocumentos: Relation<AceptacionDocumento[]>;

  @OneToOne(() => Emprendimiento, (emprendimiento) => emprendimiento.usuario)
  emprendimiento: Relation<Emprendimiento | null>;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Relation<Pedido[]>;

  @OneToMany(() => Resena, (resena) => resena.usuario)
  resenas: Relation<Resena[]>;

  @OneToMany(() => EmprendimientoFavorito, (favorito) => favorito.usuario)
  emprendimientosFavoritos: Relation<EmprendimientoFavorito[]>;

  @OneToMany(() => ProductoFavorito, (favorito) => favorito.usuario)
  productosFavoritos: Relation<ProductoFavorito[]>;

  @OneToMany(() => Reporte, (reporte) => reporte.reportadoPorUsuario)
  reportesRealizados: Relation<Reporte[]>;

  @OneToMany(() => Reporte, (reporte) => reporte.resueltoPorUsuario)
  reportesResueltos: Relation<Reporte[]>;

  @OneToMany(() => ModeracionEmprendimiento, (moderacion) => moderacion.administrador)
  moderacionesRealizadas: Relation<ModeracionEmprendimiento[]>;
}
