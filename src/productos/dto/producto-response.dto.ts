import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoRegistro } from '../../common/enums/index.js';

export class PresentacionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Bolsa 250 g' })
  nombre: string;

  @ApiPropertyOptional({ nullable: true })
  descripcion: string | null;

  @ApiPropertyOptional({ nullable: true, example: 5.5, description: 'null si es por cotizar' })
  precio: number | null;

  @ApiProperty()
  requiereCotizacion: boolean;

  @ApiProperty({ enum: EstadoRegistro })
  estado: EstadoRegistro;
}

export class ImagenProductoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '/uploads/productos/uuid.webp' })
  url: string;

  @ApiProperty()
  esPrincipal: boolean;

  @ApiProperty()
  fechaCreacion: Date;
}

export class ProductoEmprendimientoRefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  slug: string;
}

export class ProductoCategoriaRefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;
}

export class ProductoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional({ nullable: true })
  descripcion: string | null;

  @ApiProperty({ enum: EstadoRegistro })
  estado: EstadoRegistro;

  @ApiProperty({ type: ProductoCategoriaRefDto })
  categoria: ProductoCategoriaRefDto;

  @ApiPropertyOptional({ type: ProductoEmprendimientoRefDto })
  emprendimiento?: ProductoEmprendimientoRefDto;

  @ApiPropertyOptional({ nullable: true })
  imagenPrincipal: string | null;

  @ApiProperty({ type: [PresentacionResponseDto] })
  presentaciones: PresentacionResponseDto[];

  @ApiProperty({ type: [ImagenProductoResponseDto] })
  imagenes: ImagenProductoResponseDto[];

  @ApiProperty()
  fechaCreacion: Date;

  @ApiPropertyOptional({ nullable: true })
  fechaActualizacion: Date | null;
}

export class PaginationMetaDto {
  @ApiProperty()
  page: number;
  @ApiProperty()
  limit: number;
  @ApiProperty()
  total: number;
  @ApiProperty()
  totalPages: number;
}

export class PaginatedProductosDto {
  @ApiProperty({ type: [ProductoResponseDto] })
  items: ProductoResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
