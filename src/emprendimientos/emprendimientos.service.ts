import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, Repository } from 'typeorm';
import { EstadoEmprendimiento, EstadoRegistro } from '../common/enums/index.js';
import { Ubicacion } from '../geografia/entities/ubicacion.entity.js';
import type { ArchivoSubido } from '../storage/storage.interface.js';
import { StorageService } from '../storage/storage.service.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import type {
  CreateEmprendimientoDto,
  CreateRedSocialDto,
  ListarEmprendimientosQueryDto,
  UpdateEmprendimientoDto,
  UpdateRedSocialDto,
} from './dto/emprendimiento.dto.js';
import type {
  EmprendimientoDetalleDto,
  EmprendimientoResumenDto,
  ImagenEmprendimientoResponseDto,
  PaginatedEmprendimientosDto,
  RedSocialResponseDto,
  UbicacionResumenDto,
} from './dto/emprendimiento-response.dto.js';
import { CategoriaEmprendimiento } from './entities/categoria-emprendimiento.entity.js';
import { Emprendimiento } from './entities/emprendimiento.entity.js';
import { ImagenEmprendimiento } from './entities/imagen-emprendimiento.entity.js';
import { RedSocialEmprendimiento } from './entities/red-social-emprendimiento.entity.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCENTED_CHARS = 'áéíóúüñàèìòùâêîôûäëïö';
const PLAIN_CHARS = 'aeiouunaeiouaeiouaeio';

interface UbicacionRawRow {
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

interface EmprendimientoListRawRow {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  fecha_creacion: Date | string;
  categoria_id: string;
  categoria_nombre: string;
  imagen_principal: string | null;
  calificacion_promedio: string | number | null;
  total_resenas: string | number;
  distancia_km: string | number | null;
}

export function generarSlugBase(nombre: string): string {
  const normalizado = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return normalizado || 'emprendimiento';
}

function normalizarTextoBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class EmprendimientosService {
  constructor(
    @InjectRepository(Emprendimiento)
    private readonly emprendimientoRepo: Repository<Emprendimiento>,
    @InjectRepository(CategoriaEmprendimiento)
    private readonly categoriaRepo: Repository<CategoriaEmprendimiento>,
    @InjectRepository(RedSocialEmprendimiento)
    private readonly redSocialRepo: Repository<RedSocialEmprendimiento>,
    @InjectRepository(ImagenEmprendimiento)
    private readonly imagenRepo: Repository<ImagenEmprendimiento>,
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepo: Repository<Ubicacion>,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  /** RF-EMP-01: Crea el emprendimiento 1:1 del usuario y asciende su rol a `emprendedor`. */
  async crear(usuarioId: string, dto: CreateEmprendimientoDto): Promise<EmprendimientoDetalleDto> {
    const emprendimientoId = await this.dataSource.transaction(async (manager) => {
      const usuario = await manager.findOne(Usuario, { where: { id: usuarioId } });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const yaExiste = await manager.exists(Emprendimiento, { where: { usuarioId } });
      if (yaExiste) {
        throw new ConflictException('El usuario ya posee un emprendimiento registrado (relación 1:1)');
      }

      const categoria = await manager.findOne(CategoriaEmprendimiento, {
        where: { id: dto.categoriaId, estado: EstadoRegistro.ACTIVO },
      });
      if (!categoria) {
        throw new BadRequestException('La categoría de emprendimiento no existe o no está activa');
      }

      const rolEmprendedor = await manager.findOne(Rol, { where: { nombre: 'emprendedor' } });
      if (!rolEmprendedor) {
        throw new Error('Rol "emprendedor" no encontrado en base de datos');
      }

      const slug = await this.generarSlugUnico(manager, dto.nombre);
      const telefonoWhatsapp = dto.telefonoWhatsapp ?? usuario.telefono;

      const nuevo = manager.create(Emprendimiento, {
        usuarioId,
        categoriaId: categoria.id,
        nombre: dto.nombre,
        slug,
        descripcion: dto.descripcion ?? null,
        historia: dto.historia ?? null,
        telefonoWhatsapp,
        estado: EstadoEmprendimiento.ACTIVO,
      });

      let guardado: Emprendimiento;
      try {
        guardado = await manager.save(Emprendimiento, nuevo);
      } catch (error) {
        if ((error as { code?: string }).code === '23505') {
          throw new ConflictException('El usuario ya posee un emprendimiento registrado');
        }
        throw error;
      }

      await manager.update(Usuario, { id: usuarioId }, { rolId: rolEmprendedor.id });
      return guardado.id;
    });

    return this.construirDetalle(emprendimientoId, false);
  }

  /** RF-EMP-02: Ficha completa del emprendimiento del usuario autenticado. */
  async obtenerMiEmprendimiento(usuarioId: string): Promise<EmprendimientoDetalleDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    return this.construirDetalle(emp.id, false);
  }

  /** RF-EMP-02: Actualiza datos comerciales y estado (bloquea reactivación si está suspendido). */
  async actualizarMiEmprendimiento(
    usuarioId: string,
    dto: UpdateEmprendimientoDto,
  ): Promise<EmprendimientoDetalleDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);

    if (emp.estado === EstadoEmprendimiento.SUSPENDIDO && dto.estado !== undefined) {
      throw new ForbiddenException(
        'El emprendimiento está suspendido por un administrador y no puede ser reactivado por el titular',
      );
    }

    if (dto.categoriaId !== undefined && dto.categoriaId !== emp.categoriaId) {
      const categoria = await this.categoriaRepo.findOne({
        where: { id: dto.categoriaId, estado: EstadoRegistro.ACTIVO },
      });
      if (!categoria) {
        throw new BadRequestException('La categoría de emprendimiento no existe o no está activa');
      }
      emp.categoriaId = categoria.id;
    }

    if (dto.nombre !== undefined) emp.nombre = dto.nombre;
    if (dto.descripcion !== undefined) emp.descripcion = dto.descripcion;
    if (dto.historia !== undefined) emp.historia = dto.historia;
    if (dto.telefonoWhatsapp !== undefined) emp.telefonoWhatsapp = dto.telefonoWhatsapp;
    if (dto.estado !== undefined) emp.estado = dto.estado;

    await this.emprendimientoRepo.save(emp);
    return this.construirDetalle(emp.id, false);
  }

  // ---------------------------------------------------------------------------
  // Redes sociales del propio emprendimiento (RF-EMP-03)
  // ---------------------------------------------------------------------------

  async crearRedSocial(usuarioId: string, dto: CreateRedSocialDto): Promise<RedSocialResponseDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    const creada = await this.redSocialRepo.save(
      this.redSocialRepo.create({
        emprendimientoId: emp.id,
        plataforma: dto.plataforma,
        url: dto.url,
      }),
    );
    return { id: creada.id, plataforma: creada.plataforma, url: creada.url };
  }

  async actualizarRedSocial(
    usuarioId: string,
    redId: string,
    dto: UpdateRedSocialDto,
  ): Promise<RedSocialResponseDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    const red = await this.redSocialRepo.findOne({
      where: { id: redId, emprendimientoId: emp.id },
    });
    if (!red) {
      throw new NotFoundException('Red social no encontrada en tu emprendimiento');
    }

    if (dto.plataforma !== undefined) red.plataforma = dto.plataforma;
    if (dto.url !== undefined) red.url = dto.url;

    const actualizada = await this.redSocialRepo.save(red);
    return { id: actualizada.id, plataforma: actualizada.plataforma, url: actualizada.url };
  }

  async eliminarRedSocial(usuarioId: string, redId: string): Promise<void> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    const result = await this.redSocialRepo.delete({ id: redId, emprendimientoId: emp.id });
    if (!result.affected) {
      throw new NotFoundException('Red social no encontrada en tu emprendimiento');
    }
  }

  // ---------------------------------------------------------------------------
  // Imágenes del propio emprendimiento (RF-EMP-03)
  // ---------------------------------------------------------------------------

  async subirImagen(
    usuarioId: string,
    file: ArchivoSubido | undefined,
    esPrincipal = false,
  ): Promise<ImagenEmprendimientoResponseDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    const archivoGuardado = await this.storageService.subirImagen(file, 'emprendimientos');

    try {
      const imagen = await this.dataSource.transaction(async (manager) => {
        if (esPrincipal) {
          await manager.update(
            ImagenEmprendimiento,
            { emprendimientoId: emp.id, esPrincipal: true },
            { esPrincipal: false },
          );
        }
        const nueva = manager.create(ImagenEmprendimiento, {
          emprendimientoId: emp.id,
          url: archivoGuardado.url,
          esPrincipal,
        });
        return manager.save(ImagenEmprendimiento, nueva);
      });

      return {
        id: imagen.id,
        url: imagen.url,
        esPrincipal: imagen.esPrincipal,
        fechaCreacion: imagen.fechaCreacion,
      };
    } catch (error) {
      await this.storageService.eliminarArchivo(archivoGuardado.url);
      throw error;
    }
  }

  async eliminarImagen(usuarioId: string, imagenId: string): Promise<void> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);
    const imagen = await this.imagenRepo.findOne({
      where: { id: imagenId, emprendimientoId: emp.id },
    });
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada en tu emprendimiento');
    }

    await this.imagenRepo.delete({ id: imagen.id, emprendimientoId: emp.id });
    await this.storageService.eliminarArchivo(imagen.url);
  }

  async marcarImagenPrincipal(
    usuarioId: string,
    imagenId: string,
  ): Promise<ImagenEmprendimientoResponseDto> {
    const emp = await this.obtenerEntidadPorUsuario(usuarioId);

    const actualizada = await this.dataSource.transaction(async (manager) => {
      const imagen = await manager.findOne(ImagenEmprendimiento, {
        where: { id: imagenId, emprendimientoId: emp.id },
      });
      if (!imagen) {
        throw new NotFoundException('Imagen no encontrada en tu emprendimiento');
      }

      // Respeta el índice parcial único uq_imagenes_emprendimiento_principal
      await manager.update(
        ImagenEmprendimiento,
        { emprendimientoId: emp.id, esPrincipal: true },
        { esPrincipal: false },
      );

      await manager.update(
        ImagenEmprendimiento,
        { id: imagen.id, emprendimientoId: emp.id },
        { esPrincipal: true },
      );

      imagen.esPrincipal = true;
      return imagen;
    });

    return {
      id: actualizada.id,
      url: actualizada.url,
      esPrincipal: actualizada.esPrincipal,
      fechaCreacion: actualizada.fechaCreacion,
    };
  }

  // ---------------------------------------------------------------------------
  // Endpoints públicos de exploración (Módulo B: RF-DES-01 a RF-DES-05)
  // ---------------------------------------------------------------------------

  async listarPublicos(query: ListarEmprendimientosQueryDto): Promise<PaginatedEmprendimientosDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;
    const tieneCoords = query.lat !== undefined && query.lng !== undefined;

    const qb = this.emprendimientoRepo
      .createQueryBuilder('e')
      .innerJoin('e.categoria', 'cat')
      .where('e.estado = :estadoActivo', { estadoActivo: EstadoEmprendimiento.ACTIVO });

    if (query.categoriaId) {
      qb.andWhere('e.categoria_id = :categoriaId', { categoriaId: query.categoriaId });
    }

    if (query.q && query.q.trim().length > 0) {
      const termino = `%${normalizarTextoBusqueda(query.q)}%`;
      qb.andWhere(
        `(translate(lower(e.nombre), :accented, :plain) LIKE :termino OR translate(lower(COALESCE(e.descripcion, '')), :accented, :plain) LIKE :termino)`,
        {
          accented: ACCENTED_CHARS,
          plain: PLAIN_CHARS,
          termino,
        },
      );
    }

    if (query.cantonId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM ubicaciones u_f
          WHERE u_f.emprendimiento_id = e.id
            AND u_f.estado = :ubiActiva
            AND u_f.canton_id = :cantonId
        )`,
        { ubiActiva: EstadoRegistro.ACTIVO, cantonId: query.cantonId },
      );
    } else if (query.provinciaId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM ubicaciones u_f
          INNER JOIN cantones c_f ON c_f.id = u_f.canton_id
          WHERE u_f.emprendimiento_id = e.id
            AND u_f.estado = :ubiActiva
            AND c_f.provincia_id = :provinciaId
        )`,
        { ubiActiva: EstadoRegistro.ACTIVO, provinciaId: query.provinciaId },
      );
    }

    const total = await qb.getCount();

    const distanciaExpr = tieneCoords
      ? `(SELECT MIN(ST_Distance(u_d.coordenadas, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)) / 1000.0
          FROM ubicaciones u_d
          WHERE u_d.emprendimiento_id = e.id AND u_d.estado = :ubiActivaDist)`
      : 'NULL';

    const dataQb = qb
      .clone()
      .select('e.id', 'id')
      .addSelect('e.nombre', 'nombre')
      .addSelect('e.slug', 'slug')
      .addSelect('e.descripcion', 'descripcion')
      .addSelect('e.fecha_creacion', 'fecha_creacion')
      .addSelect('cat.id', 'categoria_id')
      .addSelect('cat.nombre', 'categoria_nombre')
      .addSelect(
        `(SELECT img.url FROM imagenes_emprendimiento img
          WHERE img.emprendimiento_id = e.id AND img.es_principal = true
          LIMIT 1)`,
        'imagen_principal',
      )
      .addSelect(
        `COALESCE((SELECT ROUND(AVG(r.valoracion)::numeric, 2) FROM resenas r WHERE r.emprendimiento_id = e.id), 0)`,
        'calificacion_promedio',
      )
      .addSelect(
        `(SELECT COUNT(*)::int FROM resenas r WHERE r.emprendimiento_id = e.id)`,
        'total_resenas',
      )
      .addSelect(distanciaExpr, 'distancia_km');

    if (tieneCoords) {
      dataQb.setParameters({
        lat: query.lat,
        lng: query.lng,
        ubiActivaDist: EstadoRegistro.ACTIVO,
      });
    }

    if (query.orden === 'calificacion') {
      dataQb.orderBy('calificacion_promedio', 'DESC').addOrderBy('total_resenas', 'DESC');
    } else if (query.orden === 'proximidad' && tieneCoords) {
      dataQb.orderBy('distancia_km', 'ASC', 'NULLS LAST').addOrderBy('e.fecha_creacion', 'DESC');
    } else {
      dataQb.orderBy('e.fecha_creacion', 'DESC');
    }

    const rows = await dataQb.offset(offset).limit(limit).getRawMany<EmprendimientoListRawRow>();

    const items: EmprendimientoResumenDto[] = rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      slug: row.slug,
      descripcion: row.descripcion,
      categoria: {
        id: row.categoria_id,
        nombre: row.categoria_nombre,
      },
      imagenPrincipal: row.imagen_principal,
      calificacionPromedio: Number(row.calificacion_promedio ?? 0),
      totalResenas: Number(row.total_resenas ?? 0),
      distanciaKm:
        row.distancia_km !== null && row.distancia_km !== undefined
          ? Math.round(Number(row.distancia_km) * 100) / 100
          : null,
      fechaCreacion:
        row.fecha_creacion instanceof Date ? row.fecha_creacion : new Date(row.fecha_creacion),
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  /** RF-DES-02: Ficha pública detallada por slug o UUID. Retorna 404 si no está activo. */
  async obtenerDetallePublico(slugOrId: string): Promise<EmprendimientoDetalleDto> {
    const where = UUID_REGEX.test(slugOrId)
      ? { id: slugOrId, estado: EstadoEmprendimiento.ACTIVO }
      : { slug: slugOrId, estado: EstadoEmprendimiento.ACTIVO };

    const emp = await this.emprendimientoRepo.findOne({ where });
    if (!emp) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }

    return this.construirDetalle(emp.id, true);
  }

  // ---------------------------------------------------------------------------
  // Helpers internos
  // ---------------------------------------------------------------------------

  async obtenerEntidadPorUsuario(usuarioId: string): Promise<Emprendimiento> {
    const emp = await this.emprendimientoRepo.findOne({ where: { usuarioId } });
    if (!emp) {
      throw new NotFoundException('No tienes un emprendimiento registrado');
    }
    return emp;
  }

  private async generarSlugUnico(manager: EntityManager, nombre: string): Promise<string> {
    const base = generarSlugBase(nombre);
    let candidato = base;
    let contador = 2;

    while (await manager.exists(Emprendimiento, { where: { slug: candidato } })) {
      candidato = `${base}-${contador}`;
      contador += 1;
    }

    return candidato;
  }

  private async construirDetalle(
    emprendimientoId: string,
    soloUbicacionesActivas: boolean,
  ): Promise<EmprendimientoDetalleDto> {
    const emp = await this.emprendimientoRepo.findOne({
      where: { id: emprendimientoId },
      relations: { categoria: true, redesSociales: true, imagenes: true },
    });
    if (!emp) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }

    const imagenesOrdenadas = [...(emp.imagenes ?? [])].sort((a, b) => {
      if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
      return a.fechaCreacion.getTime() - b.fechaCreacion.getTime();
    });

    const ubicacionesQb = this.ubicacionRepo
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
      .where('u.emprendimiento_id = :emprendimientoId', { emprendimientoId })
      .orderBy('u.fecha_creacion', 'ASC');

    if (soloUbicacionesActivas) {
      ubicacionesQb.andWhere('u.estado = :estadoUbi', { estadoUbi: EstadoRegistro.ACTIVO });
    }

    const ubicacionesRaw = await ubicacionesQb.getRawMany<UbicacionRawRow>();
    const ubicaciones: UbicacionResumenDto[] = ubicacionesRaw.map((row) => ({
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
    }));

    const resenaStats = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(ROUND(AVG(r.valoracion)::numeric, 2), 0)', 'promedio')
      .addSelect('COUNT(*)::int', 'total')
      .from('resenas', 'r')
      .where('r.emprendimiento_id = :emprendimientoId', { emprendimientoId })
      .getRawOne<{ promedio: string | number; total: string | number }>();

    const portada = imagenesOrdenadas.find((img) => img.esPrincipal) ?? null;

    return {
      id: emp.id,
      nombre: emp.nombre,
      slug: emp.slug,
      descripcion: emp.descripcion,
      historia: emp.historia,
      telefonoWhatsapp: emp.telefonoWhatsapp,
      estado: emp.estado,
      categoria: {
        id: emp.categoria.id,
        nombre: emp.categoria.nombre,
      },
      imagenPrincipal: portada ? portada.url : null,
      imagenes: imagenesOrdenadas.map((img) => ({
        id: img.id,
        url: img.url,
        esPrincipal: img.esPrincipal,
        fechaCreacion: img.fechaCreacion,
      })),
      redesSociales: (emp.redesSociales ?? []).map((red) => ({
        id: red.id,
        plataforma: red.plataforma,
        url: red.url,
      })),
      ubicaciones,
      calificacionPromedio: Number(resenaStats?.promedio ?? 0),
      totalResenas: Number(resenaStats?.total ?? 0),
      fechaCreacion: emp.fechaCreacion,
      fechaActualizacion: emp.fechaActualizacion,
    };
  }
}
