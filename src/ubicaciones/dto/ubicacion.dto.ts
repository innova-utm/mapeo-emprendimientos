import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
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

export class CreateUbicacionDto {
  @ApiProperty({ format: 'uuid', description: 'UUID del cantón (Ecuador)' })
  @IsUUID('all')
  cantonId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'UUID opcional de la parroquia (debe pertenecer al cantonId indicado)',
  })
  @IsOptional()
  @IsUUID('all')
  parroquiaId?: string;

  @ApiPropertyOptional({ example: 'Local Matriz Portoviejo', maxLength: 150 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(150)
  nombreSucursal?: string;

  @ApiProperty({ example: 'Av. Manabí y Calle Ramos Iduarte' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  direccion: string;

  @ApiPropertyOptional({ example: 'Frente al Parque Las Vegas' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(500)
  referencia?: string;

  @ApiPropertyOptional({ example: 'Lun-Sáb 09:00 a 18:00', maxLength: 150 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(150)
  horarioTexto?: string;

  @ApiProperty({
    example: -1.0546,
    description: 'Latitud WGS84 dentro de Ecuador (continental: -5.1..1.5, Galápagos: -1.5..1.7)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud: number;

  @ApiProperty({
    example: -80.4545,
    description:
      'Longitud WGS84 dentro de Ecuador (continental: -81.1..-75.1, Galápagos: -92.1..-89.2)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud: number;
}

export class UpdateUbicacionDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'UUID del cantón' })
  @IsOptional()
  @IsUUID('all')
  cantonId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'UUID de la parroquia (enviar null para limpiar)',
  })
  @IsOptional()
  @IsUUID('all')
  parroquiaId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Sucursal Norte', maxLength: 150 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(150)
  nombreSucursal?: string | null;

  @ApiPropertyOptional({ example: 'Av. Universitaria km 1.5' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  direccion?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Junto a la farmacia' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  referencia?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Lun-Vie 08:00 a 17:00', maxLength: 150 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(150)
  horarioTexto?: string | null;

  @ApiPropertyOptional({ example: -1.0546 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @ApiPropertyOptional({ example: -80.4545 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @ApiPropertyOptional({ enum: [EstadoRegistro.ACTIVO, EstadoRegistro.INACTIVO] })
  @IsOptional()
  @IsIn([EstadoRegistro.ACTIVO, EstadoRegistro.INACTIVO])
  estado?: EstadoRegistro;
}

export class MapaUbicacionesQueryDto {
  @ApiPropertyOptional({ example: -1.0546, description: 'Latitud de referencia del usuario' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: -80.4545, description: 'Longitud de referencia del usuario' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0.1,
    maximum: 1000,
    description: 'Radio de búsqueda en kilómetros (requiere lat y lng)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radioKm?: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por categoría de emprendimiento' })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por provincia' })
  @IsOptional()
  @IsUUID('all')
  provinciaId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por cantón' })
  @IsOptional()
  @IsUUID('all')
  cantonId?: string;
}
