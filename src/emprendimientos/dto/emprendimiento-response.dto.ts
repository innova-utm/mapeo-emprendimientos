import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoEmprendimiento, EstadoRegistro } from '../../common/enums/index.js';

export class CategoriaResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Gastronomía Artesanal' })
  nombre: string;
}

export class RedSocialResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'instagram' })
  plataforma: string;

  @ApiProperty({ example: 'https://instagram.com/cafemanabi' })
  url: string;
}

export class ImagenEmprendimientoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '/uploads/emprendimientos/uuid.webp' })
  url: string;

  @ApiProperty({ example: true })
  esPrincipal: boolean;

  @ApiProperty()
  fechaCreacion: Date;
}

export class TerritorioRefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Portoviejo' })
  nombre: string;
}

export class UbicacionResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ nullable: true, example: 'Local Matriz' })
  nombreSucursal: string | null;

  @ApiProperty({ example: 'Av. Manabí y Calle Ramos Iduarte' })
  direccion: string;

  @ApiPropertyOptional({ nullable: true, example: 'Frente al parque' })
  referencia: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Lun-Sáb 08:30 a 18:00' })
  horarioTexto: string | null;

  @ApiProperty({ example: -1.0546 })
  latitud: number;

  @ApiProperty({ example: -80.4545 })
  longitud: number;

  @ApiProperty({ enum: EstadoRegistro })
  estado: EstadoRegistro;

  @ApiProperty({ type: TerritorioRefDto })
  provincia: TerritorioRefDto;

  @ApiProperty({ type: TerritorioRefDto })
  canton: TerritorioRefDto;

  @ApiPropertyOptional({ type: TerritorioRefDto, nullable: true })
  parroquia: TerritorioRefDto | null;
}

export class EmprendimientoResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  descripcion: string | null;

  @ApiProperty({ type: CategoriaResumenDto })
  categoria: CategoriaResumenDto;

  @ApiPropertyOptional({ nullable: true, example: '/uploads/emprendimientos/uuid.webp' })
  imagenPrincipal: string | null;

  @ApiProperty({ example: 4.75 })
  calificacionPromedio: number;

  @ApiProperty({ example: 12 })
  totalResenas: number;

  @ApiPropertyOptional({ nullable: true, example: 1.35 })
  distanciaKm: number | null;

  @ApiProperty()
  fechaCreacion: Date;
}

export class PaginacionMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedEmprendimientosDto {
  @ApiProperty({ type: [EmprendimientoResumenDto] })
  items: EmprendimientoResumenDto[];

  @ApiProperty({ type: PaginacionMetaDto })
  meta: PaginacionMetaDto;
}

export class EmprendimientoDetalleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  descripcion: string | null;

  @ApiPropertyOptional({ nullable: true })
  historia: string | null;

  @ApiProperty({ example: '+593991234567' })
  telefonoWhatsapp: string;

  @ApiProperty({ enum: EstadoEmprendimiento })
  estado: EstadoEmprendimiento;

  @ApiProperty({ type: CategoriaResumenDto })
  categoria: CategoriaResumenDto;

  @ApiPropertyOptional({ nullable: true })
  imagenPrincipal: string | null;

  @ApiProperty({ type: [ImagenEmprendimientoResponseDto] })
  imagenes: ImagenEmprendimientoResponseDto[];

  @ApiProperty({ type: [RedSocialResponseDto] })
  redesSociales: RedSocialResponseDto[];

  @ApiProperty({ type: [UbicacionResumenDto] })
  ubicaciones: UbicacionResumenDto[];

  @ApiProperty({ example: 4.75 })
  calificacionPromedio: number;

  @ApiProperty({ example: 12 })
  totalResenas: number;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiPropertyOptional({ nullable: true })
  fechaActualizacion: Date | null;
}
