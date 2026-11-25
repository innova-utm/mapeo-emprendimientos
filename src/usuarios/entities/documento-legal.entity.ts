import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique, type Relation } from 'typeorm';
import { EstadoRegistro } from '../../common/enums/index.js';
import { AceptacionDocumento } from './aceptacion-documento.entity.js';

@Entity({ name: 'documentos_legales' })
@Unique('uq_documentos_tipo_version', ['tipo', 'version'])
export class DocumentoLegal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  tipo: string;

  @Column({ name: 'version', type: 'varchar', length: 30 })
  version: string;

  @Column({ name: 'contenido_url', type: 'text' })
  contenidoUrl: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoRegistro,
    enumName: 'estado_registro',
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  @Column({ name: 'fecha_publicacion', type: 'timestamptz', nullable: true })
  fechaPublicacion: Date | null;

  @OneToMany(() => AceptacionDocumento, (aceptacion) => aceptacion.documento)
  aceptaciones: Relation<AceptacionDocumento[]>;
}
