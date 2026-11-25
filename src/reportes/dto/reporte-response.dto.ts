import { ApiProperty } from '@nestjs/swagger';
import { EstadoReporte, MotivoReporte } from '../../common/enums/index.js';

export class ReporteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  reportadoPor: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  emprendimientoNombre: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  pedidoId: string | null;

  @ApiProperty({ enum: MotivoReporte, example: MotivoReporte.INCUMPLIMIENTO_PEDIDO })
  motivo: MotivoReporte;

  @ApiProperty({ example: 'No cumplió con la entrega acordada.' })
  descripcion: string;

  @ApiProperty({ enum: EstadoReporte, example: EstadoReporte.PENDIENTE })
  estado: EstadoReporte;

  @ApiProperty({ example: null, nullable: true })
  resolucion: string | null;

  @ApiProperty({ example: '2026-04-01T15:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: null, nullable: true })
  fechaResolucion: Date | null;
}

export class PaginatedReportesDto {
  @ApiProperty({ type: [ReporteResponseDto] })
  items: ReporteResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
