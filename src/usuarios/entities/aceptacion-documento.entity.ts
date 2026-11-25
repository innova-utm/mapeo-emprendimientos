import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { DocumentoLegal } from './documento-legal.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity({ name: 'aceptaciones_documentos' })
@Unique('uq_aceptaciones_usuario_documento', ['usuarioId', 'documentoId'])
export class AceptacionDocumento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'documento_id', type: 'uuid' })
  documentoId: string;

  @Column({ name: 'fecha_aceptacion', type: 'timestamptz', default: () => 'NOW()' })
  fechaAceptacion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.aceptacionesDocumentos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => DocumentoLegal, (documento) => documento.aceptaciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'documento_id' })
  documento: Relation<DocumentoLegal>;
}
