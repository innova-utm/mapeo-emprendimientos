import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TELEFONO_E164, trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';
import { EstadoEmprendimiento } from '../../common/enums/index.js';

export const ORDEN_EMPRENDIMIENTOS = ['recientes', 'calificacion', 'proximidad'] as const;
export type OrdenEmprendimientos = (typeof ORDEN_EMPRENDIMIENTOS)[number];

export class CreateEmprendimientoDto {
  @ApiProperty({
    description: 'UUID de la categoría de emprendimiento activa',
    format: 'uuid',
  })
  @IsUUID('all')
  categoriaId: string;

  @ApiProperty({ example: 'Café Manabí de Altura', maxLength: 150 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Productores artesanales de café tostado y molido en Manabí.',
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({
    example: 'Nacimos en 2022 apoyando a familias cafetaleras de la zona rural.',
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(5000)
  historia?: string;

  @ApiPropertyOptional({
    example: '+593991234567',
    description:
      'Número comercial de WhatsApp en formato E.164. Si se omite, se usa el teléfono verificado del usuario.',
  })
  @IsOptional()
  @Transform(trimTransform)
  @Matches(TELEFONO_E164, {
    message: 'telefonoWhatsapp debe estar en formato E.164 (ej. +593991234567)',
  })
  telefonoWhatsapp?: string;
}

export class UpdateEmprendimientoDto {
  @ApiPropertyOptional({
    description: 'UUID de la categoría de emprendimiento activa',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ example: 'Café Manabí de Altura', maxLength: 150 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Descripción actualizada del negocio.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  descripcion?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Historia actualizada del emprendimiento.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(5000)
  historia?: string | null;

  @ApiPropertyOptional({
    example: '+593991234567',
    description: 'Número comercial de WhatsApp en formato E.164',
  })
  @IsOptional()
  @Transform(trimTransform)
  @Matches(TELEFONO_E164, {
    message: 'telefonoWhatsapp debe estar en formato E.164 (ej. +593991234567)',
  })
  telefonoWhatsapp?: string;

  @ApiPropertyOptional({
    enum: [EstadoEmprendimiento.ACTIVO, EstadoEmprendimiento.INACTIVO],
    description:
      'Permite pausar (inactivo) o reactivar (activo) la tienda. Rechazado con 403 si está suspendida por un administrador.',
  })
  @IsOptional()
  @IsIn([EstadoEmprendimiento.ACTIVO, EstadoEmprendimiento.INACTIVO], {
    message: 'estado solo puede ser activo o inactivo',
  })
  estado?: EstadoEmprendimiento.ACTIVO | EstadoEmprendimiento.INACTIVO;
}

export class CreateRedSocialDto {
  @ApiProperty({ example: 'instagram', maxLength: 50 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  plataforma: string;

  @ApiProperty({ example: 'https://instagram.com/cafemanabi' })
  @Transform(trimTransform)
  @IsUrl({ require_protocol: true }, { message: 'url debe ser una URL válida con http:// o https://' })
  @MaxLength(500)
  url: string;
}

export class UpdateRedSocialDto {
  @ApiPropertyOptional({ example: 'tiktok', maxLength: 50 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  plataforma?: string;

  @ApiPropertyOptional({ example: 'https://tiktok.com/@cafemanabi' })
  @IsOptional()
  @Transform(trimTransform)
  @IsUrl({ require_protocol: true }, { message: 'url debe ser una URL válida con http:// o https://' })
  @MaxLength(500)
  url?: string;
}

export class SubirImagenEmprendimientoDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Si es true, marca esta imagen como portada principal del emprendimiento.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return false;
  })
  @IsBoolean()
  esPrincipal?: boolean;
}

export class ListarEmprendimientosQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;

  @ApiPropertyOptional({
    description: 'Búsqueda textual por nombre o descripción (insensible a mayúsculas y acentos)',
    example: 'cafe',
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(150)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por categoría de emprendimiento' })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por provincia de ubicaciones activas' })
  @IsOptional()
  @IsUUID('all')
  provinciaId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por cantón de ubicaciones activas' })
  @IsOptional()
  @IsUUID('all')
  cantonId?: string;

  @ApiPropertyOptional({
    enum: ORDEN_EMPRENDIMIENTOS,
    default: 'recientes',
    description: 'Criterio de ordenamiento (proximidad requiere lat y lng)',
  })
  @IsOptional()
  @IsIn(ORDEN_EMPRENDIMIENTOS)
  orden: OrdenEmprendimientos = 'recientes';

  @ApiPropertyOptional({
    example: -1.0546,
    description: 'Latitud del usuario para ordenar/calcular proximidad',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: -80.4545,
    description: 'Longitud del usuario para ordenar/calcular proximidad',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
