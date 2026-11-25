import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ubicacion } from '../geografia/entities/ubicacion.entity.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { EmprendimientosController } from './emprendimientos.controller.js';
import { EmprendimientosService } from './emprendimientos.service.js';
import { CategoriaEmprendimiento } from './entities/categoria-emprendimiento.entity.js';
import { Emprendimiento } from './entities/emprendimiento.entity.js';
import { ImagenEmprendimiento } from './entities/imagen-emprendimiento.entity.js';
import { RedSocialEmprendimiento } from './entities/red-social-emprendimiento.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Emprendimiento,
      CategoriaEmprendimiento,
      RedSocialEmprendimiento,
      ImagenEmprendimiento,
      Ubicacion,
      Usuario,
      Rol,
    ]),
  ],
  controllers: [EmprendimientosController],
  providers: [EmprendimientosService],
  exports: [EmprendimientosService],
})
export class EmprendimientosModule {}
