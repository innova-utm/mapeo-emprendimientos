import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canton } from './entities/canton.entity.js';
import { Parroquia } from './entities/parroquia.entity.js';
import { Provincia } from './entities/provincia.entity.js';

@Injectable()
export class GeografiaService {
  constructor(
    @InjectRepository(Provincia)
    private readonly provinciaRepo: Repository<Provincia>,
    @InjectRepository(Canton)
    private readonly cantonRepo: Repository<Canton>,
    @InjectRepository(Parroquia)
    private readonly parroquiaRepo: Repository<Parroquia>,
  ) {}

  async findProvincias(): Promise<Provincia[]> {
    return this.provinciaRepo.find({
      order: { nombre: 'ASC' },
    });
  }

  async findCantonesByProvincia(provinciaId: string): Promise<Canton[]> {
    const provinciaExiste = await this.provinciaRepo.existsBy({ id: provinciaId });
    if (!provinciaExiste) {
      throw new NotFoundException(`No se encontró la provincia con id ${provinciaId}`);
    }

    return this.cantonRepo.find({
      where: { provinciaId },
      order: { nombre: 'ASC' },
    });
  }

  async findParroquiasByCanton(cantonId: string): Promise<Parroquia[]> {
    const cantonExiste = await this.cantonRepo.existsBy({ id: cantonId });
    if (!cantonExiste) {
      throw new NotFoundException(`No se encontró el cantón con id ${cantonId}`);
    }

    return this.parroquiaRepo.find({
      where: { cantonId },
      order: { nombre: 'ASC' },
    });
  }
}
