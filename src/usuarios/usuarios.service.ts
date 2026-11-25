import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EstadoUsuario } from '../common/enums/index.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { UsuarioPerfilDto } from './dto/usuario-perfil.dto.js';
import { Usuario } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>) {}

  async obtenerPerfil(usuarioId: string): Promise<UsuarioPerfilDto> {
    return this.aPerfil(await this.cargarUsuario(usuarioId));
  }

  async actualizarPerfil(usuarioId: string, dto: UpdatePerfilDto): Promise<UsuarioPerfilDto> {
    const usuario = await this.cargarUsuario(usuarioId);
    if (usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new ForbiddenException('La cuenta no está activa');
    }

    if (dto.nombres !== undefined) usuario.nombres = dto.nombres;
    if (dto.apellidos !== undefined) usuario.apellidos = dto.apellidos;

    if (dto.correo !== undefined && dto.correo !== usuario.correo) {
      if (dto.correo !== null) {
        const existente = await this.usuarioRepo.findOne({
          where: { correo: dto.correo, id: Not(usuarioId) },
        });
        if (existente) {
          throw new ConflictException('El correo ya está registrado por otro usuario');
        }
      }
      usuario.correo = dto.correo;
      usuario.correoVerificado = false;
    }

    try {
      await this.usuarioRepo.save(usuario);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('El correo ya está registrado por otro usuario');
      }
      throw error;
    }
    return this.aPerfil(await this.cargarUsuario(usuarioId));
  }

  private async cargarUsuario(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: { rol: true },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  private aPerfil(usuario: Usuario): UsuarioPerfilDto {
    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      telefonoVerificado: usuario.telefonoVerificado,
      correo: usuario.correo,
      correoVerificado: usuario.correoVerificado,
      estado: usuario.estado,
      rol: usuario.rol.nombre,
      fechaCreacion: usuario.fechaCreacion,
    };
  }
}
