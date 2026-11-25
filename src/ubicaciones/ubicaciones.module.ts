import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Canton } from '../geografia/entities/canton.entity.js';
import { Parroquia } from '../geografia/entities/parroquia.entity.js';
import { Ubicacion } from '../geografia/entities/ubicacion.entity.js';
import { MapaController } from './mapa.controller.js';
import { UbicacionesController } from './ubicaciones.controller.js';
import { UbicacionesService } from './ubicaciones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ubicacion, Emprendimiento, Canton, Parroquia])],
  controllers: [UbicacionesController, MapaController],
  providers: [UbicacionesService],
  exports: [UbicacionesService],
})
export class UbicacionesModule {}
