import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoEmprendimiento, EstadoRegistro } from '../common/enums/index.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import type { ArchivoSubido } from '../storage/storage.interface.js';
import { StorageService } from '../storage/storage.service.js';
import type {
  CreatePresentacionDto,
  CreateProductoDto,
  ListarProductosQueryDto,
  UpdatePresentacionDto,
  UpdateProductoDto,
} from './dto/producto.dto.js';
import type {
  ImagenProductoResponseDto,
  PaginatedProductosDto,
  PresentacionResponseDto,
  ProductoResponseDto,
} from './dto/producto-response.dto.js';
import { CategoriaProducto } from './entities/categoria-producto.entity.js';
import { ImagenProducto } from './entities/imagen-producto.entity.js';
import { PresentacionProducto } from './entities/presentacion-producto.entity.js';
import { Producto } from './entities/producto.entity.js';

const ACCENTED_CHARS = 'áéíóúüñàèìòùâêîôûäëïö';
const PLAIN_CHARS = 'aeiouunaeiouaeiouaeio';

/**
 * Valida coherencia precio/cotización (RNF-06, espejo de `chk_presentaciones_precio`).
 * Retorna el precio normalizado a 2 decimales o `null` si el ítem es por cotizar sin precio.
 */
export function validarPrecioPresentacion(
  requiereCotizacion: boolean,
  precio: number | null | undefined,
): string | null {
  if (precio !== null && precio !== undefined && (Number.isNaN(precio) || precio < 0)) {
    throw new BadRequestException('El precio debe ser mayor o igual a 0');
  }
  if (!requiereCotizacion && (precio === null || precio === undefined)) {
    throw new BadRequestException(
      'El precio es obligatorio cuando la presentación no requiere cotización',
    );
  }
  return precio === null || precio === undefined ? null : precio.toFixed(2);
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function mapPresentacion(p: PresentacionProducto): PresentacionResponseDto {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio === null || p.precio === undefined ? null : Number(p.precio),
    requiereCotizacion: p.requiereCotizacion,
    estado: p.estado,
  };
}

function mapImagen(i: ImagenProducto): ImagenProductoResponseDto {
  return { id: i.id, url: i.url, esPrincipal: i.esPrincipal, fechaCreacion: i.fechaCreacion };
}

export function mapProducto(p: Producto, soloPresentacionesActivas = false): ProductoResponseDto {
  const imagenes = [...(p.imagenes ?? [])].sort((a, b) => {
    if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
    return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
  });
  const presentaciones = (p.presentaciones ?? []).filter(
    (x) => !soloPresentacionesActivas || x.estado === EstadoRegistro.ACTIVO,
  );
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    estado: p.estado,
    categoria: p.categoria
      ? { id: p.categoria.id, nombre: p.categoria.nombre }
      : { id: p.categoriaId, nombre: '' },
    emprendimiento: p.emprendimiento
      ? { id: p.emprendimiento.id, nombre: p.emprendimiento.nombre, slug: p.emprendimiento.slug }
      : undefined,
    imagenPrincipal: imagenes.find((i) => i.esPrincipal)?.url ?? null,
    presentaciones: presentaciones.map(mapPresentacion),
    imagenes: imagenes.map(mapImagen),
    fechaCreacion: p.fechaCreacion,
    fechaActualizacion: p.fechaActualizacion,
  };
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto) private readonly productoRepo: Repository<Producto>,
    @InjectRepository(PresentacionProducto)
    private readonly presentacionRepo: Repository<PresentacionProducto>,
    @InjectRepository(ImagenProducto) private readonly imagenRepo: Repository<ImagenProducto>,
    @InjectRepository(CategoriaProducto)
    private readonly categoriaRepo: Repository<CategoriaProducto>,
    @InjectRepository(Emprendimiento)
    private readonly emprendimientoRepo: Repository<Emprendimiento>,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // Gestión del titular (RF-CAT-01 a RF-CAT-07)
  // ---------------------------------------------------------------------------

  async crear(usuarioId: string, dto: CreateProductoDto): Promise<ProductoResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.validarCategoria(dto.categoriaId);
    const guardado = await this.productoRepo.save(
      this.productoRepo.create({
        emprendimientoId: emp.id,
        categoriaId: dto.categoriaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        estado: EstadoRegistro.ACTIVO,
      }),
    );
    return this.obtenerProductoPropio(emp.id, guardado.id);
  }

  async listarPropios(usuarioId: string): Promise<ProductoResponseDto[]> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    const productos = await this.productoRepo.find({
      where: { emprendimientoId: emp.id },
      relations: { categoria: true, presentaciones: true, imagenes: true },
      order: { fechaCreacion: 'DESC' },
    });
    return productos.map((p) => mapProducto(p));
  }

  async actualizar(
    usuarioId: string,
    productoId: string,
    dto: UpdateProductoDto,
  ): Promise<ProductoResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    const producto = await this.obtenerEntidadPropia(emp.id, productoId);

    if (dto.categoriaId !== undefined && dto.categoriaId !== producto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
      producto.categoriaId = dto.categoriaId;
    }
    if (dto.nombre !== undefined) producto.nombre = dto.nombre;
    if (dto.descripcion !== undefined) producto.descripcion = dto.descripcion;
    if (dto.estado !== undefined) producto.estado = dto.estado;

    await this.productoRepo.update(
      { id: producto.id, emprendimientoId: emp.id },
      {
        categoriaId: producto.categoriaId,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        estado: producto.estado,
      },
    );
    return this.obtenerProductoPropio(emp.id, producto.id);
  }

  // --- Presentaciones -------------------------------------------------------

  async crearPresentacion(
    usuarioId: string,
    productoId: string,
    dto: CreatePresentacionDto,
  ): Promise<PresentacionResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);
    const precio = validarPrecioPresentacion(dto.requiereCotizacion, dto.precio);

    const creada = await this.presentacionRepo.save(
      this.presentacionRepo.create({
        productoId,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        requiereCotizacion: dto.requiereCotizacion,
        precio,
        estado: EstadoRegistro.ACTIVO,
      }),
    );
    return mapPresentacion(creada);
  }

  async actualizarPresentacion(
    usuarioId: string,
    productoId: string,
    presentacionId: string,
    dto: UpdatePresentacionDto,
  ): Promise<PresentacionResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);
    const presentacion = await this.obtenerPresentacion(productoId, presentacionId);

    const requiereCotizacion = dto.requiereCotizacion ?? presentacion.requiereCotizacion;
    const precioActual = presentacion.precio === null ? null : Number(presentacion.precio);
    const precioNuevo = dto.precio !== undefined ? dto.precio : precioActual;
    presentacion.precio = validarPrecioPresentacion(requiereCotizacion, precioNuevo);
    presentacion.requiereCotizacion = requiereCotizacion;

    if (dto.nombre !== undefined) presentacion.nombre = dto.nombre;
    if (dto.descripcion !== undefined) presentacion.descripcion = dto.descripcion;
    if (dto.estado !== undefined) presentacion.estado = dto.estado;

    const guardada = await this.presentacionRepo.save(presentacion);
    return mapPresentacion(guardada);
  }

  /** Borrado lógico: `estado = 'inactivo'`. */
  async eliminarPresentacion(
    usuarioId: string,
    productoId: string,
    presentacionId: string,
  ): Promise<void> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);
    const presentacion = await this.obtenerPresentacion(productoId, presentacionId);
    await this.presentacionRepo.update({ id: presentacion.id }, { estado: EstadoRegistro.INACTIVO });
  }

  // --- Imágenes -------------------------------------------------------------

  async subirImagen(
    usuarioId: string,
    productoId: string,
    file: ArchivoSubido | undefined,
    esPrincipal = false,
  ): Promise<ImagenProductoResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);
    const archivo = await this.storageService.subirImagen(file, 'productos');

    try {
      const imagen = await this.dataSource.transaction(async (manager) => {
        if (esPrincipal) {
          await manager.update(ImagenProducto, { productoId, esPrincipal: true }, { esPrincipal: false });
        }
        return manager.save(
          ImagenProducto,
          manager.create(ImagenProducto, { productoId, url: archivo.url, esPrincipal }),
        );
      });
      return mapImagen(imagen);
    } catch (error) {
      await this.storageService.eliminarArchivo(archivo.url);
      throw error;
    }
  }

  async eliminarImagen(usuarioId: string, productoId: string, imagenId: string): Promise<void> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);
    const imagen = await this.imagenRepo.findOne({ where: { id: imagenId, productoId } });
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada en este producto');
    }
    await this.imagenRepo.delete({ id: imagen.id, productoId });
    await this.storageService.eliminarArchivo(imagen.url);
  }

  async marcarImagenPrincipal(
    usuarioId: string,
    productoId: string,
    imagenId: string,
  ): Promise<ImagenProductoResponseDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    await this.obtenerEntidadPropia(emp.id, productoId);

    const imagen = await this.dataSource.transaction(async (manager) => {
      const encontrada = await manager.findOne(ImagenProducto, { where: { id: imagenId, productoId } });
      if (!encontrada) {
        throw new NotFoundException('Imagen no encontrada en este producto');
      }
      // Respeta uq_imagenes_producto_principal: primero desmarca, luego marca.
      await manager.update(ImagenProducto, { productoId, esPrincipal: true }, { esPrincipal: false });
      await manager.update(ImagenProducto, { id: encontrada.id, productoId }, { esPrincipal: true });
      encontrada.esPrincipal = true;
      return encontrada;
    });
    return mapImagen(imagen);
  }

  // ---------------------------------------------------------------------------
  // Consulta pública (RF-CAT-08)
  // ---------------------------------------------------------------------------

  async listarPublicos(query: ListarProductosQueryDto): Promise<PaginatedProductosDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const qb = this.productoRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.emprendimiento', 'e')
      .innerJoinAndSelect('p.categoria', 'c')
      .leftJoinAndSelect('p.presentaciones', 'pr', 'pr.estado = :estadoActivo')
      .leftJoinAndSelect('p.imagenes', 'img')
      .where('p.estado = :estadoActivo', { estadoActivo: EstadoRegistro.ACTIVO })
      .andWhere('e.estado = :estadoEmpActivo', { estadoEmpActivo: EstadoEmprendimiento.ACTIVO });

    if (query.emprendimientoId) {
      qb.andWhere('p.emprendimiento_id = :empId', { empId: query.emprendimientoId });
    }
    if (query.categoriaId) {
      qb.andWhere('p.categoria_id = :catId', { catId: query.categoriaId });
    }
    if (query.q && query.q.trim().length > 0) {
      qb.andWhere(
        `(translate(lower(p.nombre), :accented, :plain) LIKE :termino OR translate(lower(COALESCE(p.descripcion, '')), :accented, :plain) LIKE :termino)`,
        { accented: ACCENTED_CHARS, plain: PLAIN_CHARS, termino: `%${normalizarTexto(query.q)}%` },
      );
    }
    if (query.precioMin !== undefined || query.precioMax !== undefined) {
      const condiciones = ['pf.producto_id = p.id', "pf.estado = 'activo'", 'pf.precio IS NOT NULL'];
      if (query.precioMin !== undefined) condiciones.push('pf.precio >= :precioMin');
      if (query.precioMax !== undefined) condiciones.push('pf.precio <= :precioMax');
      qb.andWhere(`EXISTS (SELECT 1 FROM presentaciones_producto pf WHERE ${condiciones.join(' AND ')})`, {
        precioMin: query.precioMin,
        precioMax: query.precioMax,
      });
    }

    const [productos, total] = await qb
      .orderBy('p.fechaCreacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: productos.map((p) => mapProducto(p, true)),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }

  /** 404 si el producto o su emprendimiento no están activos. */
  async obtenerDetallePublico(productoId: string): Promise<ProductoResponseDto> {
    const producto = await this.productoRepo.findOne({
      where: { id: productoId, estado: EstadoRegistro.ACTIVO },
      relations: { categoria: true, presentaciones: true, imagenes: true, emprendimiento: true },
    });
    if (!producto || producto.emprendimiento?.estado !== EstadoEmprendimiento.ACTIVO) {
      throw new NotFoundException('Producto no encontrado');
    }
    return mapProducto(producto, true);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async obtenerEmprendimientoDelUsuario(usuarioId: string): Promise<Emprendimiento> {
    const emp = await this.emprendimientoRepo.findOne({ where: { usuarioId } });
    if (!emp) {
      throw new NotFoundException('No tienes un emprendimiento registrado');
    }
    return emp;
  }

  /** Garantiza que el producto pertenezca al emprendimiento del titular autenticado. */
  private async obtenerEntidadPropia(emprendimientoId: string, productoId: string): Promise<Producto> {
    const producto = await this.productoRepo.findOne({ where: { id: productoId, emprendimientoId } });
    if (!producto) {
      throw new NotFoundException('Producto no encontrado en tu emprendimiento');
    }
    return producto;
  }

  private async obtenerProductoPropio(
    emprendimientoId: string,
    productoId: string,
  ): Promise<ProductoResponseDto> {
    const producto = await this.productoRepo.findOne({
      where: { id: productoId, emprendimientoId },
      relations: { categoria: true, presentaciones: true, imagenes: true },
    });
    if (!producto) {
      throw new NotFoundException('Producto no encontrado en tu emprendimiento');
    }
    return mapProducto(producto);
  }

  private async obtenerPresentacion(
    productoId: string,
    presentacionId: string,
  ): Promise<PresentacionProducto> {
    const presentacion = await this.presentacionRepo.findOne({
      where: { id: presentacionId, productoId },
    });
    if (!presentacion) {
      throw new NotFoundException('Presentación no encontrada en este producto');
    }
    return presentacion;
  }

  private async validarCategoria(categoriaId: string): Promise<void> {
    const categoria = await this.categoriaRepo.findOne({
      where: { id: categoriaId, estado: EstadoRegistro.ACTIVO },
    });
    if (!categoria) {
      throw new BadRequestException('La categoría de producto no existe o no está activa');
    }
  }
}
