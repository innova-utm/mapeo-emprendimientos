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
import { EstadoEmprendimiento } from '../../common/enums/index.js';
import { EmprendimientoFavorito } from '../../confianza/entities/emprendimiento-favorito.entity.js';
import { ModeracionEmprendimiento } from '../../confianza/entities/moderacion-emprendimiento.entity.js';
import { Reporte } from '../../confianza/entities/reporte.entity.js';
import { Resena } from '../../confianza/entities/resena.entity.js';
import { Ubicacion } from '../../geografia/entities/ubicacion.entity.js';
import { Pedido } from '../../pedidos/entities/pedido.entity.js';
import { Producto } from '../../productos/entities/producto.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { CategoriaEmprendimiento } from './categoria-emprendimiento.entity.js';
import { ImagenEmprendimiento } from './imagen-emprendimiento.entity.js';
import { RedSocialEmprendimiento } from './red-social-emprendimiento.entity.js';

@Entity({ name: 'emprendimientos' })
export class Emprendimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', unique: true })
  usuarioId: string;

  @Column({ name: 'categoria_id', type: 'uuid' })
  categoriaId: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'slug', type: 'varchar', length: 180, unique: true })
  slug: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'historia', type: 'text', nullable: true })
  historia: string | null;

  @Column({ name: 'telefono_whatsapp', type: 'varchar', length: 20 })
  telefonoWhatsapp: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoEmprendimiento,
    enumName: 'estado_emprendimiento',
    default: EstadoEmprendimiento.ACTIVO,
  })
  estado: EstadoEmprendimiento;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_actualizacion', type: 'timestamptz', nullable: true })
  fechaActualizacion: Date | null;

  @OneToOne(() => Usuario, (usuario) => usuario.emprendimiento, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => CategoriaEmprendimiento, (categoria) => categoria.emprendimientos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<CategoriaEmprendimiento>;

  @OneToMany(() => RedSocialEmprendimiento, (red) => red.emprendimiento)
  redesSociales: Relation<RedSocialEmprendimiento[]>;

  @OneToMany(() => ImagenEmprendimiento, (imagen) => imagen.emprendimiento)
  imagenes: Relation<ImagenEmprendimiento[]>;

  @OneToMany(() => Ubicacion, (ubicacion) => ubicacion.emprendimiento)
  ubicaciones: Relation<Ubicacion[]>;

  @OneToMany(() => Producto, (producto) => producto.emprendimiento)
  productos: Relation<Producto[]>;

  @OneToMany(() => Pedido, (pedido) => pedido.emprendimiento)
  pedidos: Relation<Pedido[]>;

  @OneToMany(() => Resena, (resena) => resena.emprendimiento)
  resenas: Relation<Resena[]>;

  @OneToMany(() => EmprendimientoFavorito, (favorito) => favorito.emprendimiento)
  favoritos: Relation<EmprendimientoFavorito[]>;

  @OneToMany(() => Reporte, (reporte) => reporte.emprendimiento)
  reportes: Relation<Reporte[]>;

  @OneToMany(() => ModeracionEmprendimiento, (moderacion) => moderacion.emprendimiento)
  moderaciones: Relation<ModeracionEmprendimiento[]>;
}
