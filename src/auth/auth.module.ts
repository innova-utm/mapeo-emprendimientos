import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AceptacionDocumento } from '../usuarios/entities/aceptacion-documento.entity.js';
import { CodigoVerificacion } from '../usuarios/entities/codigo-verificacion.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, CodigoVerificacion, Rol, DocumentoLegal, AceptacionDocumento]),
    UsuariosModule,
    WhatsappModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
