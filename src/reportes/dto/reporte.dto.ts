import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
import { MotivoReporte } from '../../common/enums/index.js';

export class CreateReporteDto {
  @ApiProperty({ format: 'uuid', description: 'UUID del emprendimiento reportado' })
  @IsUUID('all')
  emprendimientoId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'UUID opcional del pedido asociado (debe pertenecer al usuario y al emprendimiento)',
  })
  @IsOptional()
  @IsUUID('all')
  pedidoId?: string;

  @ApiProperty({ enum: MotivoReporte, example: MotivoReporte.INCUMPLIMIENTO_PEDIDO })
  @IsEnum(MotivoReporte)
  motivo: MotivoReporte;

  @ApiProperty({
    example: 'Se coordinó la entrega por WhatsApp pero nunca llegó el pedido ni respondieron.',
    maxLength: 2000,
  })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descripcion: string;
}

export class ListarMisReportesQueryDto {
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
}
