import { ApiProperty } from '@nestjs/swagger';
import { EstadoUsuario } from '../../common/enums/index.js';

export class UsuarioPerfilDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'María' })
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  apellidos: string;

  @ApiProperty({ example: '+593991234567' })
  telefono: string;

  @ApiProperty()
  telefonoVerificado: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'maria@correo.com' })
  correo: string | null;

  @ApiProperty()
  correoVerificado: boolean;

  @ApiProperty({ enum: EstadoUsuario })
  estado: EstadoUsuario;

  @ApiProperty({ example: 'consumidor', description: 'Nombre del rol (RBAC)' })
  rol: string;

  @ApiProperty()
  fechaCreacion: Date;
}
