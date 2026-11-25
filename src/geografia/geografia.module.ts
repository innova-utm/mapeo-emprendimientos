import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canton } from './entities/canton.entity.js';
import { Parroquia } from './entities/parroquia.entity.js';
import { Provincia } from './entities/provincia.entity.js';
import { GeografiaController } from './geografia.controller.js';
import { GeografiaService } from './geografia.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Provincia, Canton, Parroquia])],
  controllers: [GeografiaController],
  providers: [GeografiaService],
  exports: [GeografiaService],
})
export class GeografiaModule {}
