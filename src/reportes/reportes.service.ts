import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoReporte } from '../common/enums/index.js';
import { Reporte } from '../confianza/entities/reporte.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import type { CreateReporteDto, ListarMisReportesQueryDto } from './dto/reporte.dto.js';
import type { PaginatedReportesDto, ReporteResponseDto } from './dto/reporte-response.dto.js';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    @InjectRepository(Emprendimiento)
    private readonly empRepo: Repository<Emprendimiento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
  ) {}

  async crear(usuarioId: string, dto: CreateReporteDto): Promise<ReporteResponseDto> {
    const emprendimiento = await this.empRepo.findOne({
      where: { id: dto.emprendimientoId },
    });
    if (!emprendimiento) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }

    if (dto.pedidoId) {
      const pedido = await this.pedidoRepo.findOne({ where: { id: dto.pedidoId } });
      if (!pedido) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (pedido.usuarioId !== usuarioId) {
        throw new ForbiddenException('El pedido indicado no te pertenece');
      }
      if (pedido.emprendimientoId !== dto.emprendimientoId) {
        throw new BadRequestException(
          'El pedido indicado no pertenece al emprendimiento reportado',
        );
      }
    }

    const guardado = await this.reporteRepo.save(
      this.reporteRepo.create({
        reportadoPor: usuarioId,
        emprendimientoId: dto.emprendimientoId,
        pedidoId: dto.pedidoId ?? null,
        motivo: dto.motivo,
        descripcion: dto.descripcion,
        estado: EstadoReporte.PENDIENTE,
      }),
    );

    return this.mapReporte(guardado, emprendimiento.nombre);
  }

  async listarMisReportes(
    usuarioId: string,
    query: ListarMisReportesQueryDto,
  ): Promise<PaginatedReportesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const [items, total] = await this.reporteRepo.findAndCount({
      where: { reportadoPor: usuarioId },
      relations: { emprendimiento: true },
      order: { fechaCreacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((r) => this.mapReporte(r, r.emprendimiento?.nombre ?? '')),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private mapReporte(r: Reporte, emprendimientoNombre: string): ReporteResponseDto {
    return {
      id: r.id,
      reportadoPor: r.reportadoPor,
      emprendimientoId: r.emprendimientoId,
      emprendimientoNombre,
      pedidoId: r.pedidoId,
      motivo: r.motivo,
      descripcion: r.descripcion,
      estado: r.estado,
      resolucion: r.resolucion,
      fechaCreacion: r.fechaCreacion,
      fechaResolucion: r.fechaResolucion,
    };
  }
}
