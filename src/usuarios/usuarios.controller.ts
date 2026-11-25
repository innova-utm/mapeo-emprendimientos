import { Body, Controller, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type UsuarioAutenticado } from '../common/auth/index.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { UsuarioPerfilDto } from './dto/usuario-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Patch('perfil')
  @Roles('consumidor', 'emprendedor', 'administrador')
  @ApiOperation({
    summary: 'Actualizar perfil básico (RF-AUT-05)',
    description:
      'Actualiza nombres, apellidos y correo opcional del usuario autenticado. El teléfono no se modifica aquí.',
  })
  @ApiOkResponse({ type: UsuarioPerfilDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiConflictResponse({ description: 'El correo ya pertenece a otro usuario' })
  actualizarPerfil(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: UpdatePerfilDto,
  ): Promise<UsuarioPerfilDto> {
    return this.usuariosService.actualizarPerfil(usuario.id, dto);
  }
}
