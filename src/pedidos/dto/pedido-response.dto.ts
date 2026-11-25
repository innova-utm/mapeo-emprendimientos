import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '../../common/enums/index.js';

export class DetallePedidoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombreProducto: string;

  @ApiProperty()
  nombrePresentacion: string;

  @ApiProperty()
  requiereCotizacion: boolean;

  @ApiPropertyOptional({ nullable: true })
  precioUnitario: number | null;

  @ApiProperty()
  cantidad: number;
}

export class CompradorContactoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  nombre: string;
  @ApiProperty({ example: '+593991234567' })
  telefono: string;
}

export class PedidoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'PED-000001' })
  codigoPedido: string;

  @ApiProperty({ format: 'uuid' })
  emprendimientoId: string;

  @ApiProperty()
  nombreEmprendimiento: string;

  @ApiProperty({ enum: EstadoPedido })
  estado: EstadoPedido;

  @ApiPropertyOptional({ nullable: true })
  notaComprador: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Suma de ítems con precio; null si todo es por cotizar' })
  totalReferencial: number | null;

  @ApiProperty({ description: 'true si algún ítem requiere cotización' })
  tieneItemsPorCotizar: boolean;

  @ApiProperty()
  compradorConfirmoRecepcion: boolean;

  @ApiPropertyOptional({ nullable: true })
  fechaConfirmacionComprador: Date | null;

  @ApiProperty({ type: [DetallePedidoResponseDto] })
  detalles: DetallePedidoResponseDto[];

  @ApiPropertyOptional({ type: CompradorContactoDto, description: 'Solo visible para el titular receptor' })
  comprador?: CompradorContactoDto;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiPropertyOptional({ nullable: true })
  fechaActualizacion: Date | null;
}

export class PedidoCreadoResponseDto extends PedidoResponseDto {
  @ApiProperty({
    example: 'https://wa.me/593991234567?text=Hola...',
    description: 'Deep link de WhatsApp al número snapshot del emprendimiento',
  })
  whatsappUrl: string;

  @ApiProperty({ description: 'Mensaje preventivo anti-estafas (RN-15)' })
  avisoSeguridad: string;
}

export class PaginatedPedidosDto {
  @ApiProperty({ type: [PedidoResponseDto] })
  items: PedidoResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 12, total: 0, totalPages: 0 },
  })
  meta: { page: number; limit: number; total: number; totalPages: number };
}
