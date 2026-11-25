import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoEmprendimiento, EstadoRegistro } from '../common/enums/index.js';
import type { UbicacionResumenDto } from '../emprendimientos/dto/emprendimiento-response.dto.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Canton } from '../geografia/entities/canton.entity.js';
import { Parroquia } from '../geografia/entities/parroquia.entity.js';
import { Ubicacion } from '../geografia/entities/ubicacion.entity.js';
import type {
  CreateUbicacionDto,
  MapaUbicacionesQueryDto,
  UpdateUbicacionDto,
} from './dto/ubicacion.dto.js';
import type { MapaMarcadorDto } from './dto/ubicacion-response.dto.js';
import { validarCoordenadaEnEcuador } from './ecuador-geo.util.js';

interface UbicacionDetalleRaw {
  id: string;
  nombre_sucursal: string | null;
  direccion: string;
  referencia: string | null;
  horario_texto: string | null;
  estado: EstadoRegistro;
  latitud: string | number;
  longitud: string | number;
  canton_id: string;
  canton_nombre: string;
  provincia_id: string;
  provincia_nombre: string;
  parroquia_id: string | null;
  parroquia_nombre: string | null;
}

interface MapaMarcadorRaw extends UbicacionDetalleRaw {
  distancia_km: string | number | null;
  emprendimiento_id: string;
  emprendimiento_nombre: string;
  emprendimiento_slug: string;
  categoria_id: string;
  categoria_nombre: string;
  imagen_principal: string | null;
}

@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepo: Repository<Ubicacion>,
    @InjectRepository(Emprendimiento)
    private readonly emprendimientoRepo: Repository<Emprendimiento>,
    @InjectRepository(Canton)
    private readonly cantonRepo: Repository<Canton>,
    @InjectRepository(Parroquia)
    private readonly parroquiaRepo: Repository<Parroquia>,
  ) {}

  async crear(usuarioId: string, dto: CreateUbicacionDto): Promise<UbicacionResumenDto> {
    validarCoordenadaEnEcuador(dto.latitud, dto.longitud);

    const emp = await this.obtenerEmprendimientoDelTitular(usuarioId);
    await this.validarTerritorio(dto.cantonId, dto.parroquiaId);

    const result = await this.ubicacionRepo
      .createQueryBuilder()
      .insert()
      .into(Ubicacion)
      .values({
        emprendimientoId: emp.id,
        cantonId: dto.cantonId,
        parroquiaId: dto.parroquiaId ?? null,
        nombreSucursal: dto.nombreSucursal ?? null,
        direccion: dto.direccion,
        referencia: dto.referencia ?? null,
        horarioTexto: dto.horarioTexto ?? null,
        estado: EstadoRegistro.ACTIVO,
        coordenadas: () => 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography',
      })
      .setParameters({ lat: dto.latitud, lng: dto.longitud })
      .returning('id')
      .execute();

    const nuevaId = (result.identifiers[0] as { id: string } | undefined)?.id ??
      (result.raw as Array<{ id: string }>)[0]?.id;

    return this.obtenerUbicacionDetalle(nuevaId);
  }

  async actualizar(
    usuarioId: string,
    ubicacionId: string,
    dto: UpdateUbicacionDto,
  ): Promise<UbicacionResumenDto> {
    const emp = await this.obtenerEmprendimientoDelTitular(usuarioId);

    const existente = await this.ubicacionRepo.findOne({
      where: { id: ubicacionId, emprendimientoId: emp.id },
    });
    if (!existente) {
      throw new NotFoundException('Ubicación no encontrada en tu emprendimiento');
    }

    const tieneLat = dto.latitud !== undefined;
    const tieneLng = dto.longitud !== undefined;
    if (tieneLat !== tieneLng) {
      throw new BadRequestException('Debes enviar latitud y longitud juntas para actualizar coordenadas');
    }
    if (tieneLat && tieneLng) {
      validarCoordenadaEnEcuador(dto.latitud!, dto.longitud!);
    }

    const cantonObjetivo = dto.cantonId ?? existente.cantonId;
    const parroquiaObjetivo =
      dto.parroquiaId !== undefined ? dto.parroquiaId : existente.parroquiaId;

    if (dto.cantonId !== undefined || dto.parroquiaId !== undefined) {
      await this.validarTerritorio(cantonObjetivo, parroquiaObjetivo);
    }

    const setPayload: Record<string, unknown> = {};
    if (dto.cantonId !== undefined) setPayload.cantonId = dto.cantonId;
    if (dto.parroquiaId !== undefined) setPayload.parroquiaId = dto.parroquiaId;
    if (dto.nombreSucursal !== undefined) setPayload.nombreSucursal = dto.nombreSucursal;
    if (dto.direccion !== undefined) setPayload.direccion = dto.direccion;
    if (dto.referencia !== undefined) setPayload.referencia = dto.referencia;
    if (dto.horarioTexto !== undefined) setPayload.horarioTexto = dto.horarioTexto;
    if (dto.estado !== undefined) setPayload.estado = dto.estado;

    if (tieneLat && tieneLng) {
      setPayload.coordenadas = () => 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
    }

    if (Object.keys(setPayload).length > 0) {
      const qb = this.ubicacionRepo
        .createQueryBuilder()
        .update(Ubicacion)
        .set(setPayload)
        .where('id = :ubicacionId AND emprendimiento_id = :empId', {
          ubicacionId: existente.id,
          empId: emp.id,
        });

      if (tieneLat && tieneLng) {
        qb.setParameters({ lat: dto.latitud, lng: dto.longitud });
      }

      await qb.execute();
    }

    return this.obtenerUbicacionDetalle(existente.id);
  }

  /** Borrado lógico: cambia estado a `inactivo` sin eliminar físicamente la fila. */
  async eliminarLogico(usuarioId: string, ubicacionId: string): Promise<void> {
    const emp = await this.obtenerEmprendimientoDelTitular(usuarioId);
    const result = await this.ubicacionRepo.update(
      { id: ubicacionId, emprendimientoId: emp.id },
      { estado: EstadoRegistro.INACTIVO },
    );
    if (!result.affected) {
      throw new NotFoundException('Ubicación no encontrada en tu emprendimiento');
    }
  }

  /**
   * RF-MAP-01 a RF-MAP-04 / RF-MAP-08:
   * Devuelve marcadores activos únicamente de emprendimientos activos.
   * Usa ST_DWithin y ST_Distance sobre geography(Point, 4326) aprovechando el índice GIST.
   */
  async listarMapa(query: MapaUbicacionesQueryDto): Promise<MapaMarcadorDto[]> {
    const tieneLat = query.lat !== undefined;
    const tieneLng = query.lng !== undefined;
    if (tieneLat !== tieneLng) {
      throw new BadRequestException('Debes proporcionar lat y lng juntos');
    }
    const tieneCoords = tieneLat && tieneLng;
    if (query.radioKm !== undefined && !tieneCoords) {
      throw new BadRequestException('radioKm requiere enviar lat y lng');
    }

    const qb = this.ubicacionRepo
      .createQueryBuilder('u')
      .innerJoin('u.emprendimiento', 'e')
      .innerJoin('e.categoria', 'cat')
      .innerJoin('u.canton', 'c')
      .innerJoin('c.provincia', 'p')
      .leftJoin('u.parroquia', 'pa')
      .select('u.id', 'id')
      .addSelect('u.nombre_sucursal', 'nombre_sucursal')
      .addSelect('u.direccion', 'direccion')
      .addSelect('u.referencia', 'referencia')
      .addSelect('u.horario_texto', 'horario_texto')
      .addSelect('u.estado', 'estado')
      .addSelect('ST_Y(u.coordenadas::geometry)', 'latitud')
      .addSelect('ST_X(u.coordenadas::geometry)', 'longitud')
      .addSelect('c.id', 'canton_id')
      .addSelect('c.nombre', 'canton_nombre')
      .addSelect('p.id', 'provincia_id')
      .addSelect('p.nombre', 'provincia_nombre')
      .addSelect('pa.id', 'parroquia_id')
      .addSelect('pa.nombre', 'parroquia_nombre')
      .addSelect('e.id', 'emprendimiento_id')
      .addSelect('e.nombre', 'emprendimiento_nombre')
      .addSelect('e.slug', 'emprendimiento_slug')
      .addSelect('cat.id', 'categoria_id')
      .addSelect('cat.nombre', 'categoria_nombre')
      .addSelect(
        `(SELECT img.url FROM imagenes_emprendimiento img
          WHERE img.emprendimiento_id = e.id AND img.es_principal = true
          LIMIT 1)`,
        'imagen_principal',
      )
      .where('u.estado = :ubiActiva', { ubiActiva: EstadoRegistro.ACTIVO })
      .andWhere('e.estado = :empActivo', { empActivo: EstadoEmprendimiento.ACTIVO });

    if (tieneCoords) {
      qb.addSelect(
        'ST_Distance(u.coordenadas, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000.0',
        'distancia_km',
      ).setParameters({ lat: query.lat, lng: query.lng });

      if (query.radioKm !== undefined) {
        qb.andWhere(
          'ST_DWithin(u.coordenadas, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radioMetros)',
          { radioMetros: query.radioKm * 1000 },
        );
      }

      qb.orderBy('distancia_km', 'ASC');
    } else {
      qb.addSelect('NULL', 'distancia_km').orderBy('e.fecha_creacion', 'DESC');
    }

    if (query.categoriaId) {
      qb.andWhere('e.categoria_id = :categoriaId', { categoriaId: query.categoriaId });
    }
    if (query.cantonId) {
      qb.andWhere('u.canton_id = :cantonId', { cantonId: query.cantonId });
    } else if (query.provinciaId) {
      qb.andWhere('c.provincia_id = :provinciaId', { provinciaId: query.provinciaId });
    }

    const rows = await qb.getRawMany<MapaMarcadorRaw>();

    return rows.map((row) => ({
      ubicacionId: row.id,
      nombreSucursal: row.nombre_sucursal,
      direccion: row.direccion,
      referencia: row.referencia,
      horarioTexto: row.horario_texto,
      latitud: Number(row.latitud),
      longitud: Number(row.longitud),
      distanciaKm:
        row.distancia_km !== null && row.distancia_km !== undefined
          ? Math.round(Number(row.distancia_km) * 100) / 100
          : null,
      provincia: { id: row.provincia_id, nombre: row.provincia_nombre },
      canton: { id: row.canton_id, nombre: row.canton_nombre },
      parroquia: row.parroquia_id
        ? { id: row.parroquia_id, nombre: row.parroquia_nombre ?? '' }
        : null,
      emprendimiento: {
        id: row.emprendimiento_id,
        nombre: row.emprendimiento_nombre,
        slug: row.emprendimiento_slug,
        categoria: {
          id: row.categoria_id,
          nombre: row.categoria_nombre,
        },
        imagenPrincipal: row.imagen_principal,
      },
    }));
  }

  private async obtenerEmprendimientoDelTitular(usuarioId: string): Promise<Emprendimiento> {
    const emp = await this.emprendimientoRepo.findOne({ where: { usuarioId } });
    if (!emp) {
      throw new NotFoundException('No tienes un emprendimiento registrado');
    }
    return emp;
  }

  private async validarTerritorio(cantonId: string, parroquiaId?: string | null): Promise<void> {
    const cantonExiste = await this.cantonRepo.existsBy({ id: cantonId });
    if (!cantonExiste) {
      throw new BadRequestException('El cantón indicado no existe');
    }

    if (parroquiaId) {
      const parroquia = await this.parroquiaRepo.findOne({ where: { id: parroquiaId } });
      if (!parroquia) {
        throw new BadRequestException('La parroquia indicada no existe');
      }
      if (parroquia.cantonId !== cantonId) {
        throw new BadRequestException(
          'La parroquia seleccionada no pertenece al cantón indicado',
        );
      }
    }
  }

  private async obtenerUbicacionDetalle(ubicacionId: string): Promise<UbicacionResumenDto> {
    const row = await this.ubicacionRepo
      .createQueryBuilder('u')
      .innerJoin('u.canton', 'c')
      .innerJoin('c.provincia', 'p')
      .leftJoin('u.parroquia', 'pa')
      .select('u.id', 'id')
      .addSelect('u.nombre_sucursal', 'nombre_sucursal')
      .addSelect('u.direccion', 'direccion')
      .addSelect('u.referencia', 'referencia')
      .addSelect('u.horario_texto', 'horario_texto')
      .addSelect('u.estado', 'estado')
      .addSelect('ST_Y(u.coordenadas::geometry)', 'latitud')
      .addSelect('ST_X(u.coordenadas::geometry)', 'longitud')
      .addSelect('c.id', 'canton_id')
      .addSelect('c.nombre', 'canton_nombre')
      .addSelect('p.id', 'provincia_id')
      .addSelect('p.nombre', 'provincia_nombre')
      .addSelect('pa.id', 'parroquia_id')
      .addSelect('pa.nombre', 'parroquia_nombre')
      .where('u.id = :ubicacionId', { ubicacionId })
      .getRawOne<UbicacionDetalleRaw>();

    if (!row) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    return {
      id: row.id,
      nombreSucursal: row.nombre_sucursal,
      direccion: row.direccion,
      referencia: row.referencia,
      horarioTexto: row.horario_texto,
      latitud: Number(row.latitud),
      longitud: Number(row.longitud),
      estado: row.estado,
      provincia: { id: row.provincia_id, nombre: row.provincia_nombre },
      canton: { id: row.canton_id, nombre: row.canton_nombre },
      parroquia: row.parroquia_id
        ? { id: row.parroquia_id, nombre: row.parroquia_nombre ?? '' }
        : null,
    };
  }
}
