import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';
import {
  AccionModeracion,
  EstadoEmprendimiento,
  EstadoReporte,
  MotivoReporte,
} from '../../common/enums/index.js';

export class ListarReportesAdminQueryDto {
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

  @ApiPropertyOptional({ enum: EstadoReporte })
  @IsOptional()
  @IsEnum(EstadoReporte)
  estado?: EstadoReporte;

  @ApiPropertyOptional({ enum: MotivoReporte })
  @IsOptional()
  @IsEnum(MotivoReporte)
  motivo?: MotivoReporte;
}

export class ActualizarReporteAdminDto {
  @ApiProperty({ enum: EstadoReporte, example: EstadoReporte.RESUELTO })
  @IsEnum(EstadoReporte)
  estado: EstadoReporte;

  @ApiPropertyOptional({
    example: 'Se verificó el incidente y se aplicó suspensión al emprendimiento.',
    maxLength: 2000,
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  resolucion?: string;
}

export class ListarEmprendimientosAdminQueryDto {
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

  @ApiPropertyOptional({ enum: EstadoEmprendimiento })
  @IsOptional()
  @IsEnum(EstadoEmprendimiento)
  estado?: EstadoEmprendimiento;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  categoriaId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  provinciaId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  cantonId?: string;
}

export class ModerarEmprendimientoDto {
  @ApiProperty({ enum: AccionModeracion, example: AccionModeracion.SUSPENSION })
  @IsEnum(AccionModeracion)
  accion: AccionModeracion;

  @ApiProperty({
    example: 'Múltiples reportes confirmados de incumplimiento en entregas.',
    maxLength: 2000,
  })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  motivo: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'UUID opcional del reporte que origina la acción de moderación',
  })
  @IsOptional()
  @IsUUID('all')
  reporteId?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si se envía reporteId y este campo es true, marca automáticamente el reporte como resuelto en la misma transacción.',
  })
  @IsOptional()
  @IsBoolean()
  cerrarReporte?: boolean;

  @ApiPropertyOptional({
    example: 'Reporte cerrado tras suspender el emprendimiento.',
    maxLength: 2000,
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  resolucionReporte?: string;
}
