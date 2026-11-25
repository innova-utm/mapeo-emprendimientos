import { ApiProperty } from '@nestjs/swagger';
import {
  AccionModeracion,
  EstadoEmprendimiento,
  EstadoReporte,
  MotivoReporte,
} from '../../common/enums/index.js';

export class ReporteAdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  reportadoPor: string;

  @ApiProperty({ example: 'Juan Pérez' })
  reportadoPorNombre: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  emprendimientoNombre: string;

  @ApiProperty({ enum: EstadoEmprendimiento })
  emprendimientoEstado: EstadoEmprendimiento;

  @ApiProperty({ format: 'uuid', nullable: true })
  pedidoId: string | null;

  @ApiProperty({ enum: MotivoReporte })
  motivo: MotivoReporte;

  @ApiProperty()
  descripcion: string;

  @ApiProperty({ enum: EstadoReporte })
  estado: EstadoReporte;

  @ApiProperty({ format: 'uuid', nullable: true })
  resueltoPor: string | null;

  @ApiProperty({ nullable: true })
  resolucion: string | null;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiProperty({ nullable: true })
  fechaResolucion: Date | null;
}

export class PaginatedReportesAdminDto {
  @ApiProperty({ type: [ReporteAdminResponseDto] })
  items: ReporteAdminResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class EmprendimientoAdminItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'Ana Gómez' })
  titularNombre: string;

  @ApiProperty({ example: '+593991234567' })
  telefonoWhatsapp: string;

  @ApiProperty({ format: 'uuid' })
  categoriaId: string;

  @ApiProperty({ example: 'Agroindustria y Alimentos' })
  categoriaNombre: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiProperty({ enum: EstadoEmprendimiento })
  estado: EstadoEmprendimiento;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiProperty({ nullable: true })
  fechaActualizacion: Date | null;
}

export class PaginatedEmprendimientosAdminDto {
  @ApiProperty({ type: [EmprendimientoAdminItemDto] })
  items: EmprendimientoAdminItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ModeracionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ format: 'uuid' })
  administradorId: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  reporteId: string | null;

  @ApiProperty({ enum: AccionModeracion })
  accion: AccionModeracion;

  @ApiProperty()
  motivo: string;

  @ApiProperty()
  fechaModeracion: Date;

  @ApiProperty({
    enum: EstadoEmprendimiento,
    description: 'Estado del emprendimiento resultante tras la moderación',
  })
  estadoEmprendimientoActual: EstadoEmprendimiento;

  @ApiProperty({
    description: 'Indica si el reporte vinculado fue cerrado automáticamente',
  })
  reporteCerrado: boolean;
}

export class EmprendimientosPorEstadoDto {
  @ApiProperty({ example: 42 })
  activo: number;

  @ApiProperty({ example: 5 })
  inactivo: number;

  @ApiProperty({ example: 2 })
  suspendido: number;

  @ApiProperty({ example: 49 })
  total: number;
}

export class PedidosPorEstadoDto {
  @ApiProperty({ example: 10 })
  nuevo: number;

  @ApiProperty({ example: 8 })
  confirmado: number;

  @ApiProperty({ example: 4 })
  preparando: number;

  @ApiProperty({ example: 120 })
  entregado: number;

  @ApiProperty({ example: 6 })
  cancelado: number;

  @ApiProperty({ example: 148 })
  total: number;

  @ApiProperty({
    example: 95,
    description: 'Pedidos entregados que además tienen confirmación explícita del comprador (RN-13)',
  })
  entregadosConfirmadosPorComprador: number;
}

export class EstadisticasResumenDto {
  @ApiProperty({ type: EmprendimientosPorEstadoDto })
  emprendimientosPorEstado: EmprendimientosPorEstadoDto;

  @ApiProperty({ example: 350 })
  totalUsuarios: number;

  @ApiProperty({ example: 320 })
  usuariosVerificados: number;

  @ApiProperty({ example: 215 })
  totalProductosActivos: number;

  @ApiProperty({ type: PedidosPorEstadoDto })
  pedidosPorEstado: PedidosPorEstadoDto;
}

export class DistribucionCategoriaItemDto {
  @ApiProperty({ format: 'uuid' })
  categoriaId: string;

  @ApiProperty({ example: 'Agroindustria y Alimentos' })
  categoriaNombre: string;

  @ApiProperty({ example: 15 })
  total: number;
}

export class DistribucionUbicacionItemDto {
  @ApiProperty({ format: 'uuid' })
  provinciaId: string;

  @ApiProperty({ example: 'Manabí' })
  provinciaNombre: string;

  @ApiProperty({ format: 'uuid' })
  cantonId: string;

  @ApiProperty({ example: 'Portoviejo' })
  cantonNombre: string;

  @ApiProperty({ example: 12 })
  total: number;
}

export class TopEmprendimientoDto {
  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiProperty({ example: 48 })
  pedidosEntregados: number;

  @ApiProperty({ example: 40 })
  pedidosConfirmadosPorComprador: number;

  @ApiProperty({ example: 4.85, nullable: true })
  promedioValoracion: number | null;

  @ApiProperty({ example: 20 })
  totalResenas: number;
}

export class EstadisticasDistribucionDto {
  @ApiProperty({ type: [DistribucionCategoriaItemDto] })
  emprendimientosPorCategoria: DistribucionCategoriaItemDto[];

  @ApiProperty({ type: [DistribucionUbicacionItemDto] })
  emprendimientosPorUbicacion: DistribucionUbicacionItemDto[];

  @ApiProperty({ type: [TopEmprendimientoDto] })
  topEmprendimientosPorPedidosEntregados: TopEmprendimientoDto[];
}
