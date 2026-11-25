import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';
import { EstadoRegistro } from '../../common/enums/index.js';

export class CreateCategoriaAdminDto {
  @ApiProperty({ example: 'Artesanías Manabitas', maxLength: 100 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Productos elaborados a mano por artesanos ecuatorianos.',
    maxLength: 500,
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;
}

export class UpdateCategoriaAdminDto {
  @ApiPropertyOptional({ example: 'Artesanías y Manualidades', maxLength: 100 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción de la categoría.', maxLength: 500 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @ApiPropertyOptional({ enum: EstadoRegistro, example: EstadoRegistro.INACTIVO })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;
}

export class CreateDocumentoLegalAdminDto {
  @ApiProperty({ example: 'Términos y Condiciones de Uso', maxLength: 150 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ example: 'terminos_uso', maxLength: 50 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo: string;

  @ApiProperty({ example: '2.0', maxLength: 30 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  version: string;

  @ApiProperty({ example: 'https://plataformamapeo.ec/legal/terminos-v2.0.pdf' })
  @Transform(trimTransform)
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  contenidoUrl: string;

  @ApiPropertyOptional({ enum: EstadoRegistro, default: EstadoRegistro.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Fecha oficial de entrada en vigor (ISO 8601 UTC). Si se omite y el estado es activo, usa NOW().',
  })
  @IsOptional()
  @IsDateString()
  fechaPublicacion?: string;
}

export class UpdateDocumentoLegalAdminDto {
  @ApiPropertyOptional({ example: 'Términos y Condiciones de Uso (Actualizado)', maxLength: 150 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ example: 'https://plataformamapeo.ec/legal/terminos-v2.0-rev.pdf' })
  @IsOptional()
  @Transform(trimTransform)
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  contenidoUrl?: string;

  @ApiPropertyOptional({ enum: EstadoRegistro, example: EstadoRegistro.INACTIVO })
  @IsOptional()
  @IsEnum(EstadoRegistro)
  estado?: EstadoRegistro;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fechaPublicacion?: string | null;
}
