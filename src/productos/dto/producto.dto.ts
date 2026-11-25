import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';
import { EstadoRegistro } from '../../common/enums/index.js';

export class CreateProductoDto {
  @ApiProperty({ format: 'uuid', description: 'UUID de la categoría de producto activa' })
  @IsUUID('all')
  categoriaId: string;

  @ApiProperty({ example: 'Café tostado de altura', maxLength: 150 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'Café 100% arábico tostado artesanalmente.' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(3000)
  descripcion?: string;
}

export class UpdateProductoDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(3000)
  descripcion?: string;

  @ApiPropertyOptional({ enum: EstadoRegistro, description: 'Borrado lógico: activo | inactivo' })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;
}

export class CreatePresentacionDto {
  @ApiProperty({ example: 'Bolsa 250 g', maxLength: 100 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'Molido fino' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiProperty({
    example: false,
    description: 'Si es true, el precio es opcional y el ítem se marca como "por cotizar"',
  })
  @IsBoolean()
  requiereCotizacion: boolean;

  @ApiPropertyOptional({
    example: 5.5,
    minimum: 0,
    description: 'Obligatorio y >= 0 cuando requiereCotizacion = false (chk_presentaciones_precio)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999_999.99)
  precio?: number;
}

export class UpdatePresentacionDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiereCotizacion?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999_999.99)
  precio?: number;

  @ApiPropertyOptional({ enum: EstadoRegistro })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;
}

export class SubirImagenProductoDto {
  @ApiPropertyOptional({ default: false, description: 'Marca la imagen como principal' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' || value === true ? true : value === 'false' || value === false ? false : value,
  )
  @IsBoolean()
  esPrincipal?: boolean;
}

export class ListarProductosQueryDto {
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

  @ApiPropertyOptional({ description: 'Búsqueda por nombre o descripción (sin acentos)' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(150)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  emprendimientoId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Precio mínimo de alguna presentación activa' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Precio máximo de alguna presentación activa' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;
}
