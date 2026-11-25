import { ApiProperty } from '@nestjs/swagger';

export class ResenaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  pedidoId: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'María López', description: 'Nombre público del autor' })
  autorNombre: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  valoracion: number;

  @ApiProperty({ example: 'Excelente atención y producto fresco.', nullable: true })
  comentario: string | null;

  @ApiProperty({ example: '2026-04-01T15:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: null, nullable: true })
  fechaActualizacion: Date | null;
}

export class PaginatedResenasDto {
  @ApiProperty({ type: [ResenaResponseDto] })
  items: ResenaResponseDto[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 4.75, nullable: true, description: 'Promedio de valoración (1 a 5)' })
  promedioValoracion: number | null;

  @ApiProperty({ example: 12, description: 'Total de reseñas del emprendimiento' })
  totalResenas: number;
}
