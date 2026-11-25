import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmprendimientoFavorito } from '../confianza/entities/emprendimiento-favorito.entity.js';
import { ProductoFavorito } from '../confianza/entities/producto-favorito.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { Producto } from '../productos/entities/producto.entity.js';
import type {
  EmprendimientoFavoritoResponseDto,
  ProductoFavoritoResponseDto,
} from './dto/favorito-response.dto.js';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

@Injectable()
export class FavoritosService {
  constructor(
    @InjectRepository(EmprendimientoFavorito)
    private readonly empFavRepo: Repository<EmprendimientoFavorito>,
    @InjectRepository(ProductoFavorito)
    private readonly prodFavRepo: Repository<ProductoFavorito>,
    @InjectRepository(Emprendimiento)
    private readonly empRepo: Repository<Emprendimiento>,
    @InjectRepository(Producto)
    private readonly prodRepo: Repository<Producto>,
  ) {}

  async agregarEmprendimiento(
    usuarioId: string,
    emprendimientoId: string,
  ): Promise<EmprendimientoFavoritoResponseDto> {
    const emp = await this.empRepo.findOne({
      where: { id: emprendimientoId },
      relations: { categoria: true, imagenes: true },
    });
    if (!emp) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }

    const existente = await this.empFavRepo.findOne({
      where: { usuarioId, emprendimientoId },
    });
    if (existente) {
      throw new ConflictException('El emprendimiento ya está en tus favoritos');
    }

    let guardado: EmprendimientoFavorito;
    try {
      guardado = await this.empFavRepo.save(
        this.empFavRepo.create({ usuarioId, emprendimientoId }),
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('El emprendimiento ya está en tus favoritos');
      }
      throw err;
    }

    return this.mapEmprendimientoFavorito(guardado, emp);
  }

  async eliminarEmprendimiento(usuarioId: string, emprendimientoId: string): Promise<void> {
    await this.empFavRepo.delete({ usuarioId, emprendimientoId });
  }

  async listarEmprendimientos(usuarioId: string): Promise<EmprendimientoFavoritoResponseDto[]> {
    const favoritos = await this.empFavRepo.find({
      where: { usuarioId },
      relations: { emprendimiento: { categoria: true, imagenes: true } },
      order: { fechaCreacion: 'DESC' },
    });

    return favoritos.map((fav) => this.mapEmprendimientoFavorito(fav, fav.emprendimiento));
  }

  async agregarProducto(
    usuarioId: string,
    productoId: string,
  ): Promise<ProductoFavoritoResponseDto> {
    const prod = await this.prodRepo.findOne({
      where: { id: productoId },
      relations: { emprendimiento: true, categoria: true, imagenes: true },
    });
    if (!prod) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existente = await this.prodFavRepo.findOne({
      where: { usuarioId, productoId },
    });
    if (existente) {
      throw new ConflictException('El producto ya está en tus favoritos');
    }

    let guardado: ProductoFavorito;
    try {
      guardado = await this.prodFavRepo.save(this.prodFavRepo.create({ usuarioId, productoId }));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('El producto ya está en tus favoritos');
      }
      throw err;
    }

    return this.mapProductoFavorito(guardado, prod);
  }

  async eliminarProducto(usuarioId: string, productoId: string): Promise<void> {
    await this.prodFavRepo.delete({ usuarioId, productoId });
  }

  async listarProductos(usuarioId: string): Promise<ProductoFavoritoResponseDto[]> {
    const favoritos = await this.prodFavRepo.find({
      where: { usuarioId },
      relations: { producto: { emprendimiento: true, categoria: true, imagenes: true } },
      order: { fechaCreacion: 'DESC' },
    });

    return favoritos.map((fav) => this.mapProductoFavorito(fav, fav.producto));
  }

  private mapEmprendimientoFavorito(
    fav: EmprendimientoFavorito,
    emp: Emprendimiento,
  ): EmprendimientoFavoritoResponseDto {
    const imagenPrincipal =
      emp.imagenes?.find((img) => img.esPrincipal) ?? emp.imagenes?.[0] ?? null;

    return {
      id: fav.id,
      emprendimientoId: emp.id,
      nombre: emp.nombre,
      slug: emp.slug,
      estado: emp.estado,
      categoriaNombre: emp.categoria?.nombre ?? null,
      imagenPrincipalUrl: imagenPrincipal?.url ?? null,
      fechaCreacion: fav.fechaCreacion,
    };
  }

  private mapProductoFavorito(
    fav: ProductoFavorito,
    prod: Producto,
  ): ProductoFavoritoResponseDto {
    const imagenPrincipal =
      prod.imagenes?.find((img) => img.esPrincipal) ?? prod.imagenes?.[0] ?? null;

    return {
      id: fav.id,
      productoId: prod.id,
      nombre: prod.nombre,
      estado: prod.estado,
      emprendimientoId: prod.emprendimientoId,
      emprendimientoNombre: prod.emprendimiento?.nombre ?? '',
      emprendimientoEstado: prod.emprendimiento?.estado,
      categoriaNombre: prod.categoria?.nombre ?? null,
      imagenPrincipalUrl: imagenPrincipal?.url ?? null,
      fechaCreacion: fav.fechaCreacion,
    };
  }
}
