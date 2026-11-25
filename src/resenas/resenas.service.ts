import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoPedido } from '../common/enums/index.js';
import { Resena } from '../confianza/entities/resena.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import type { CreateResenaDto, ListarResenasQueryDto, UpdateResenaDto } from './dto/resena.dto.js';
import type { PaginatedResenasDto, ResenaResponseDto } from './dto/resena-response.dto.js';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena)
    private readonly resenaRepo: Repository<Resena>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Emprendimiento)
    private readonly empRepo: Repository<Emprendimiento>,
  ) {}

  async crear(usuarioId: string, dto: CreateResenaDto): Promise<ResenaResponseDto> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: dto.pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('Solo puedes reseñar tus propios pedidos');
    }

    const elegible =
      pedido.estado === EstadoPedido.ENTREGADO || pedido.compradorConfirmoRecepcion === true;
    if (!elegible) {
      throw new BadRequestException(
        'Solo puedes reseñar un pedido entregado o cuya recepción hayas confirmado',
      );
    }

    const existente = await this.resenaRepo.findOne({ where: { pedidoId: pedido.id } });
    if (existente) {
      throw new ConflictException('Ya existe una reseña registrada para este pedido');
    }

    let guardada: Resena;
    try {
      guardada = await this.resenaRepo.save(
        this.resenaRepo.create({
          pedidoId: pedido.id,
          usuarioId: pedido.usuarioId,
          emprendimientoId: pedido.emprendimientoId,
          valoracion: dto.valoracion,
          comentario: dto.comentario ?? null,
        }),
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Ya existe una reseña registrada para este pedido');
      }
      throw err;
    }

    const completa = await this.resenaRepo.findOne({
      where: { id: guardada.id },
      relations: { usuario: true },
    });

    return this.mapResena(completa ?? guardada);
  }

  async actualizar(
    usuarioId: string,
    resenaId: string,
    dto: UpdateResenaDto,
  ): Promise<ResenaResponseDto> {
    const resena = await this.resenaRepo.findOne({
      where: { id: resenaId },
      relations: { usuario: true },
    });

    if (!resena) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (resena.usuarioId !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar esta reseña');
    }

    if (dto.valoracion === undefined && dto.comentario === undefined) {
      throw new BadRequestException('Debes enviar al menos valoracion o comentario para actualizar');
    }

    const patch: Partial<Resena> = {};
    if (dto.valoracion !== undefined) {
      patch.valoracion = dto.valoracion;
    }
    if (dto.comentario !== undefined) {
      patch.comentario = dto.comentario;
    }

    await this.resenaRepo.update({ id: resenaId }, patch);

    const actualizada = await this.resenaRepo.findOne({
      where: { id: resenaId },
      relations: { usuario: true },
    });

    if (actualizada) {
      return this.mapResena(actualizada);
    }

    if (patch.valoracion !== undefined) resena.valoracion = patch.valoracion;
    if (patch.comentario !== undefined) resena.comentario = patch.comentario;
    return this.mapResena(resena);
  }

  async listarPorEmprendimiento(
    emprendimientoId: string,
    query: ListarResenasQueryDto,
  ): Promise<PaginatedResenasDto> {
    const existe = await this.empRepo.exists({ where: { id: emprendimientoId } });
    if (!existe) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const [[items, total], stats] = await Promise.all([
      this.resenaRepo.findAndCount({
        where: { emprendimientoId },
        relations: { usuario: true },
        order: { fechaCreacion: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.resenaRepo
        .createQueryBuilder('r')
        .select('AVG(r.valoracion)', 'promedio')
        .addSelect('COUNT(r.id)', 'total')
        .where('r.emprendimiento_id = :emprendimientoId', { emprendimientoId })
        .getRawOne<{ promedio: string | null; total: string }>(),
    ]);

    const totalResenas = Number(stats?.total ?? total);
    const promedioValoracion =
      stats?.promedio !== null && stats?.promedio !== undefined
        ? Number(Number(stats.promedio).toFixed(2))
        : null;

    return {
      items: items.map((r) => this.mapResena(r)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      promedioValoracion,
      totalResenas,
    };
  }

  private mapResena(r: Resena): ResenaResponseDto {
    const autorNombre = r.usuario
      ? `${r.usuario.nombres} ${r.usuario.apellidos}`.trim()
      : '';

    return {
      id: r.id,
      pedidoId: r.pedidoId,
      usuarioId: r.usuarioId,
      autorNombre,
      emprendimientoId: r.emprendimientoId,
      valoracion: r.valoracion,
      comentario: r.comentario,
      fechaCreacion: r.fechaCreacion,
      fechaActualizacion: r.fechaActualizacion,
    };
  }
}
