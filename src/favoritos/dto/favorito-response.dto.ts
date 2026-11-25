import { ApiProperty } from '@nestjs/swagger';
import { EstadoEmprendimiento, EstadoRegistro } from '../../common/enums/index.js';

export class EmprendimientoFavoritoResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID del registro de favorito' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiProperty({
    enum: EstadoEmprendimiento,
    example: EstadoEmprendimiento.ACTIVO,
    description: 'Estado actual del emprendimiento para indicar si dejó de estar activo',
  })
  estado: EstadoEmprendimiento;

  @ApiProperty({ example: 'Agroindustria y Alimentos', nullable: true })
  categoriaNombre: string | null;

  @ApiProperty({ example: 'https://cdn.ejemplo.ec/img.webp', nullable: true })
  imagenPrincipalUrl: string | null;

  @ApiProperty({ example: '2026-04-01T15:00:00.000Z' })
  fechaCreacion: Date;
}

export class ProductoFavoritoResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID del registro de favorito' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productoId: string;

  @ApiProperty({ example: 'Café molido orgánico' })
  nombre: string;

  @ApiProperty({
    enum: EstadoRegistro,
    example: EstadoRegistro.ACTIVO,
    description: 'Estado actual del producto para indicar si dejó de estar activo',
  })
  estado: EstadoRegistro;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  emprendimientoNombre: string;

  @ApiProperty({
    enum: EstadoEmprendimiento,
    example: EstadoEmprendimiento.ACTIVO,
    description: 'Estado actual del emprendimiento propietario del producto',
  })
  emprendimientoEstado: EstadoEmprendimiento;

  @ApiProperty({ example: 'Café y Bebidas', nullable: true })
  categoriaNombre: string | null;

  @ApiProperty({ example: 'https://cdn.ejemplo.ec/prod.webp', nullable: true })
  imagenPrincipalUrl: string | null;

  @ApiProperty({ example: '2026-04-01T15:00:00.000Z' })
  fechaCreacion: Date;
}
