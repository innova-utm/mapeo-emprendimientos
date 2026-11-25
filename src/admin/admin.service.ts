import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { CategoriaCatalogoDto, DocumentoLegalDto } from '../catalogos/dto/catalogo-response.dto.js';
import {
  AccionModeracion,
  EstadoEmprendimiento,
  EstadoPedido,
  EstadoRegistro,
  EstadoReporte,
} from '../common/enums/index.js';
import { ModeracionEmprendimiento } from '../confianza/entities/moderacion-emprendimiento.entity.js';
import { Reporte } from '../confianza/entities/reporte.entity.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { Producto } from '../productos/entities/producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import type {
  CreateCategoriaAdminDto,
  CreateDocumentoLegalAdminDto,
  UpdateCategoriaAdminDto,
  UpdateDocumentoLegalAdminDto,
} from './dto/admin-catalogos.dto.js';
import type {
  ActualizarReporteAdminDto,
  ListarEmprendimientosAdminQueryDto,
  ListarReportesAdminQueryDto,
  ModerarEmprendimientoDto,
} from './dto/admin-moderacion.dto.js';
import type {
  EstadisticasDistribucionDto,
  EstadisticasResumenDto,
  ModeracionResponseDto,
  PaginatedEmprendimientosAdminDto,
  PaginatedReportesAdminDto,
  ReporteAdminResponseDto,
} from './dto/admin-response.dto.js';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CategoriaEmprendimiento)
    private readonly catEmpRepo: Repository<CategoriaEmprendimiento>,
    @InjectRepository(CategoriaProducto)
    private readonly catProdRepo: Repository<CategoriaProducto>,
    @InjectRepository(DocumentoLegal)
    private readonly docLegalRepo: Repository<DocumentoLegal>,
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    @InjectRepository(Emprendimiento)
    private readonly empRepo: Repository<Emprendimiento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Producto)
    private readonly prodRepo: Repository<Producto>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly dataSource: DataSource,
  ) {}

  // ===========================================================================
  // Catálogos (RF-ADM-02, RF-ADM-03)
  // ===========================================================================

  async crearCategoriaEmprendimiento(dto: CreateCategoriaAdminDto): Promise<CategoriaCatalogoDto> {
    try {
      const entity = this.catEmpRepo.create({
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        estado: dto.estado ?? EstadoRegistro.ACTIVO,
      });
      return await this.catEmpRepo.save(entity);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Ya existe una categoría de emprendimiento con ese nombre');
      }
      throw err;
    }
  }

  async actualizarCategoriaEmprendimiento(
    id: string,
    dto: UpdateCategoriaAdminDto,
  ): Promise<CategoriaCatalogoDto> {
    const cat = await this.catEmpRepo.findOne({ where: { id } });
    if (!cat) {
      throw new NotFoundException('Categoría de emprendimiento no encontrada');
    }

    if (dto.nombre !== undefined) cat.nombre = dto.nombre;
    if (dto.descripcion !== undefined) cat.descripcion = dto.descripcion;
    if (dto.estado !== undefined) cat.estado = dto.estado;

    try {
      return await this.catEmpRepo.save(cat);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Ya existe una categoría de emprendimiento con ese nombre');
      }
      throw err;
    }
  }

  async crearCategoriaProducto(dto: CreateCategoriaAdminDto): Promise<CategoriaCatalogoDto> {
    try {
      const entity = this.catProdRepo.create({
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        estado: dto.estado ?? EstadoRegistro.ACTIVO,
      });
      return await this.catProdRepo.save(entity);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Ya existe una categoría de producto con ese nombre');
      }
      throw err;
    }
  }

  async actualizarCategoriaProducto(
    id: string,
    dto: UpdateCategoriaAdminDto,
  ): Promise<CategoriaCatalogoDto> {
    const cat = await this.catProdRepo.findOne({ where: { id } });
    if (!cat) {
      throw new NotFoundException('Categoría de producto no encontrada');
    }

    if (dto.nombre !== undefined) cat.nombre = dto.nombre;
    if (dto.descripcion !== undefined) cat.descripcion = dto.descripcion;
    if (dto.estado !== undefined) cat.estado = dto.estado;

    try {
      return await this.catProdRepo.save(cat);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Ya existe una categoría de producto con ese nombre');
      }
      throw err;
    }
  }

  // ===========================================================================
  // Documentos legales (RF-ADM-10)
  // ===========================================================================

  async crearDocumentoLegal(dto: CreateDocumentoLegalAdminDto): Promise<DocumentoLegalDto> {
    const estado = dto.estado ?? EstadoRegistro.ACTIVO;
    const fechaPublicacion = dto.fechaPublicacion
      ? new Date(dto.fechaPublicacion)
      : estado === EstadoRegistro.ACTIVO
        ? new Date()
        : null;

    try {
      const entity = this.docLegalRepo.create({
        nombre: dto.nombre,
        tipo: dto.tipo,
        version: dto.version,
        contenidoUrl: dto.contenidoUrl,
        estado,
        fechaPublicacion,
      });
      return await this.docLegalRepo.save(entity);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          'Ya existe un documento legal con el mismo tipo y versión',
        );
      }
      throw err;
    }
  }

  async actualizarDocumentoLegal(
    id: string,
    dto: UpdateDocumentoLegalAdminDto,
  ): Promise<DocumentoLegalDto> {
    const doc = await this.docLegalRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento legal no encontrado');
    }

    if (dto.nombre !== undefined) doc.nombre = dto.nombre;
    if (dto.contenidoUrl !== undefined) doc.contenidoUrl = dto.contenidoUrl;
    if (dto.estado !== undefined) doc.estado = dto.estado;
    if (dto.fechaPublicacion !== undefined) {
      doc.fechaPublicacion = dto.fechaPublicacion ? new Date(dto.fechaPublicacion) : null;
    }

    return this.docLegalRepo.save(doc);
  }

  // ===========================================================================
  // Bandeja de reportes (RF-ADM-04, RF-ADM-05)
  // ===========================================================================

  async listarReportes(query: ListarReportesAdminQueryDto): Promise<PaginatedReportesAdminDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const qb = this.reporteRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reportadoPorUsuario', 'u')
      .leftJoinAndSelect('r.emprendimiento', 'e')
      .orderBy('r.fechaCreacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.estado) {
      qb.andWhere('r.estado = :estado', { estado: query.estado });
    }
    if (query.motivo) {
      qb.andWhere('r.motivo = :motivo', { motivo: query.motivo });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((r) => this.mapReporteAdmin(r)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async actualizarReporte(
    adminId: string,
    reporteId: string,
    dto: ActualizarReporteAdminDto,
  ): Promise<ReporteAdminResponseDto> {
    const reporte = await this.reporteRepo.findOne({
      where: { id: reporteId },
      relations: { reportadoPorUsuario: true, emprendimiento: true },
    });
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    reporte.estado = dto.estado;
    if (dto.resolucion !== undefined) {
      reporte.resolucion = dto.resolucion;
    }

    const esCierre =
      dto.estado === EstadoReporte.RESUELTO || dto.estado === EstadoReporte.DESCARTADO;
    if (esCierre) {
      reporte.resueltoPor = adminId;
      reporte.fechaResolucion = new Date();
    }

    const guardado = await this.reporteRepo.save(reporte);
    return this.mapReporteAdmin(guardado);
  }

  // ===========================================================================
  // Moderación reactiva de emprendimientos (RF-ADM-06, RF-ADM-07, RN-14/RN-16)
  // ===========================================================================

  async listarEmprendimientos(
    query: ListarEmprendimientosAdminQueryDto,
  ): Promise<PaginatedEmprendimientosAdminDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const qb = this.empRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.usuario', 'u')
      .leftJoinAndSelect('e.categoria', 'c')
      .orderBy('e.fechaCreacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.estado) {
      qb.andWhere('e.estado = :estado', { estado: query.estado });
    }
    if (query.categoriaId) {
      qb.andWhere('e.categoriaId = :categoriaId', { categoriaId: query.categoriaId });
    }
    if (query.cantonId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM ubicaciones ub WHERE ub.emprendimiento_id = e.id AND ub.canton_id = :cantonId)',
        { cantonId: query.cantonId },
      );
    } else if (query.provinciaId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM ubicaciones ub INNER JOIN cantones ca ON ca.id = ub.canton_id WHERE ub.emprendimiento_id = e.id AND ca.provincia_id = :provinciaId)',
        { provinciaId: query.provinciaId },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((e) => ({
        id: e.id,
        usuarioId: e.usuarioId,
        titularNombre: e.usuario ? `${e.usuario.nombres} ${e.usuario.apellidos}`.trim() : '',
        telefonoWhatsapp: e.telefonoWhatsapp,
        categoriaId: e.categoriaId,
        categoriaNombre: e.categoria?.nombre ?? '',
        nombre: e.nombre,
        slug: e.slug,
        estado: e.estado,
        fechaCreacion: e.fechaCreacion,
        fechaActualizacion: e.fechaActualizacion,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async moderarEmprendimiento(
    adminId: string,
    emprendimientoId: string,
    dto: ModerarEmprendimientoDto,
  ): Promise<ModeracionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const emp = await manager.findOne(Emprendimiento, {
        where: { id: emprendimientoId },
      });
      if (!emp) {
        throw new NotFoundException('Emprendimiento no encontrado');
      }

      let reporteVinculado: Reporte | null = null;
      if (dto.reporteId) {
        reporteVinculado = await manager.findOne(Reporte, {
          where: { id: dto.reporteId },
        });
        if (!reporteVinculado) {
          throw new NotFoundException('Reporte vinculado no encontrado');
        }
        if (reporteVinculado.emprendimientoId !== emprendimientoId) {
          throw new BadRequestException(
            'El reporte vinculado no pertenece a este emprendimiento',
          );
        }
      }

      const moderacion = manager.create(ModeracionEmprendimiento, {
        emprendimientoId,
        administradorId: adminId,
        reporteId: dto.reporteId ?? null,
        accion: dto.accion,
        motivo: dto.motivo,
      });
      const guardada = await manager.save(ModeracionEmprendimiento, moderacion);

      let estadoActual = emp.estado;
      if (dto.accion === AccionModeracion.SUSPENSION) {
        estadoActual = EstadoEmprendimiento.SUSPENDIDO;
        await manager.update(Emprendimiento, { id: emprendimientoId }, { estado: estadoActual });
      } else if (dto.accion === AccionModeracion.REACTIVACION) {
        estadoActual = EstadoEmprendimiento.ACTIVO;
        await manager.update(Emprendimiento, { id: emprendimientoId }, { estado: estadoActual });
      }

      let reporteCerrado = false;
      if (reporteVinculado && dto.cerrarReporte === true) {
        await manager.update(
          Reporte,
          { id: reporteVinculado.id },
          {
            estado: EstadoReporte.RESUELTO,
            resueltoPor: adminId,
            resolucion: dto.resolucionReporte ?? dto.motivo,
            fechaResolucion: new Date(),
          },
        );
        reporteCerrado = true;
      }

      return {
        id: guardada.id,
        emprendimientoId: guardada.emprendimientoId,
        administradorId: guardada.administradorId,
        reporteId: guardada.reporteId,
        accion: guardada.accion,
        motivo: guardada.motivo,
        fechaModeracion: guardada.fechaModeracion,
        estadoEmprendimientoActual: estadoActual,
        reporteCerrado,
      };
    });
  }

  // ===========================================================================
  // Dashboard y estadísticas (RF-ADM-08, RF-ADM-09, RN-13/RN-15)
  // ===========================================================================

  async obtenerEstadisticasResumen(): Promise<EstadisticasResumenDto> {
    const [
      empRows,
      totalUsuarios,
      usuariosVerificados,
      totalProductosActivos,
      pedidoRows,
      entregadosConfirmados,
    ] = await Promise.all([
      this.empRepo
        .createQueryBuilder('e')
        .select('e.estado', 'estado')
        .addSelect('COUNT(e.id)', 'total')
        .groupBy('e.estado')
        .getRawMany<{ estado: EstadoEmprendimiento; total: string }>(),
      this.usuarioRepo.count(),
      this.usuarioRepo.count({ where: { telefonoVerificado: true } }),
      this.prodRepo.count({ where: { estado: EstadoRegistro.ACTIVO } }),
      this.pedidoRepo
        .createQueryBuilder('p')
        .select('p.estado', 'estado')
        .addSelect('COUNT(p.id)', 'total')
        .groupBy('p.estado')
        .getRawMany<{ estado: EstadoPedido; total: string }>(),
      this.pedidoRepo.count({
        where: { estado: EstadoPedido.ENTREGADO, compradorConfirmoRecepcion: true },
      }),
    ]);

    const empMap = new Map(empRows.map((r) => [r.estado, Number(r.total)]));
    const empActivo = empMap.get(EstadoEmprendimiento.ACTIVO) ?? 0;
    const empInactivo = empMap.get(EstadoEmprendimiento.INACTIVO) ?? 0;
    const empSuspendido = empMap.get(EstadoEmprendimiento.SUSPENDIDO) ?? 0;

    const pedMap = new Map(pedidoRows.map((r) => [r.estado, Number(r.total)]));
    const pedNuevo = pedMap.get(EstadoPedido.NUEVO) ?? 0;
    const pedConfirmado = pedMap.get(EstadoPedido.CONFIRMADO) ?? 0;
    const pedPreparando = pedMap.get(EstadoPedido.PREPARANDO) ?? 0;
    const pedEntregado = pedMap.get(EstadoPedido.ENTREGADO) ?? 0;
    const pedCancelado = pedMap.get(EstadoPedido.CANCELADO) ?? 0;

    return {
      emprendimientosPorEstado: {
        activo: empActivo,
        inactivo: empInactivo,
        suspendido: empSuspendido,
        total: empActivo + empInactivo + empSuspendido,
      },
      totalUsuarios,
      usuariosVerificados,
      totalProductosActivos,
      pedidosPorEstado: {
        nuevo: pedNuevo,
        confirmado: pedConfirmado,
        preparando: pedPreparando,
        entregado: pedEntregado,
        cancelado: pedCancelado,
        total: pedNuevo + pedConfirmado + pedPreparando + pedEntregado + pedCancelado,
        entregadosConfirmadosPorComprador: entregadosConfirmados,
      },
    };
  }

  async obtenerEstadisticasDistribucion(): Promise<EstadisticasDistribucionDto> {
    const [porCategoria, porUbicacion, topEmprendimientos] = await Promise.all([
      this.dataSource.query<
        Array<{ categoriaId: string; categoriaNombre: string; total: string }>
      >(
        `SELECT c.id AS "categoriaId",
                c.nombre AS "categoriaNombre",
                COUNT(e.id)::text AS "total"
         FROM categorias_emprendimiento c
         INNER JOIN emprendimientos e ON e.categoria_id = c.id
         WHERE e.estado = $1
         GROUP BY c.id, c.nombre
         ORDER BY COUNT(e.id) DESC, c.nombre ASC`,
        [EstadoEmprendimiento.ACTIVO],
      ),
      this.dataSource.query<
        Array<{
          provinciaId: string;
          provinciaNombre: string;
          cantonId: string;
          cantonNombre: string;
          total: string;
        }>
      >(
        `SELECT pr.id AS "provinciaId",
                pr.nombre AS "provinciaNombre",
                ca.id AS "cantonId",
                ca.nombre AS "cantonNombre",
                COUNT(DISTINCT e.id)::text AS "total"
         FROM ubicaciones ub
         INNER JOIN emprendimientos e ON e.id = ub.emprendimiento_id
         INNER JOIN cantones ca ON ca.id = ub.canton_id
         INNER JOIN provincias pr ON pr.id = ca.provincia_id
         WHERE e.estado = $1 AND ub.estado = $2
         GROUP BY pr.id, pr.nombre, ca.id, ca.nombre
         ORDER BY COUNT(DISTINCT e.id) DESC, pr.nombre ASC, ca.nombre ASC`,
        [EstadoEmprendimiento.ACTIVO, EstadoRegistro.ACTIVO],
      ),
      this.dataSource.query<
        Array<{
          emprendimientoId: string;
          nombre: string;
          slug: string;
          pedidosEntregados: string;
          pedidosConfirmadosPorComprador: string;
          promedioValoracion: string | null;
          totalResenas: string;
        }>
      >(
        `SELECT e.id AS "emprendimientoId",
                e.nombre AS "nombre",
                e.slug AS "slug",
                COUNT(DISTINCT p.id)::text AS "pedidosEntregados",
                COUNT(DISTINCT p.id) FILTER (WHERE p.comprador_confirmo_recepcion = TRUE)::text AS "pedidosConfirmadosPorComprador",
                ROUND(AVG(r.valoracion)::numeric, 2)::text AS "promedioValoracion",
                COUNT(DISTINCT r.id)::text AS "totalResenas"
         FROM emprendimientos e
         INNER JOIN pedidos p ON p.emprendimiento_id = e.id AND p.estado = $1
         LEFT JOIN resenas r ON r.emprendimiento_id = e.id
         GROUP BY e.id, e.nombre, e.slug
         ORDER BY COUNT(DISTINCT p.id) DESC, AVG(r.valoracion) DESC NULLS LAST
         LIMIT 10`,
        [EstadoPedido.ENTREGADO],
      ),
    ]);

    return {
      emprendimientosPorCategoria: porCategoria.map((r) => ({
        categoriaId: r.categoriaId,
        categoriaNombre: r.categoriaNombre,
        total: Number(r.total),
      })),
      emprendimientosPorUbicacion: porUbicacion.map((r) => ({
        provinciaId: r.provinciaId,
        provinciaNombre: r.provinciaNombre,
        cantonId: r.cantonId,
        cantonNombre: r.cantonNombre,
        total: Number(r.total),
      })),
      topEmprendimientosPorPedidosEntregados: topEmprendimientos.map((r) => ({
        emprendimientoId: r.emprendimientoId,
        nombre: r.nombre,
        slug: r.slug,
        pedidosEntregados: Number(r.pedidosEntregados),
        pedidosConfirmadosPorComprador: Number(r.pedidosConfirmadosPorComprador),
        promedioValoracion: r.promedioValoracion !== null ? Number(r.promedioValoracion) : null,
        totalResenas: Number(r.totalResenas),
      })),
    };
  }

  private mapReporteAdmin(r: Reporte): ReporteAdminResponseDto {
    const reportadoPorNombre = r.reportadoPorUsuario
      ? `${r.reportadoPorUsuario.nombres} ${r.reportadoPorUsuario.apellidos}`.trim()
      : '';

    return {
      id: r.id,
      reportadoPor: r.reportadoPor,
      reportadoPorNombre,
      emprendimientoId: r.emprendimientoId,
      emprendimientoNombre: r.emprendimiento?.nombre ?? '',
      emprendimientoEstado: r.emprendimiento?.estado,
      pedidoId: r.pedidoId,
      motivo: r.motivo,
      descripcion: r.descripcion,
      estado: r.estado,
      resueltoPor: r.resueltoPor,
      resolucion: r.resolucion,
      fechaCreacion: r.fechaCreacion,
      fechaResolucion: r.fechaResolucion,
    };
  }
}
