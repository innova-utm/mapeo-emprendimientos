import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';
import { EstadoPedido } from '../../common/enums/index.js';

export class PedidoItemDto {
  @ApiProperty({ format: 'uuid', description: 'UUID de la presentación activa' })
  @IsUUID('all')
  presentacionId: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 999 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  cantidad: number;
}

export class NotaEmprendimientoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  emprendimientoId: string;

  @ApiProperty({ example: 'Retiro en la tarde, por favor.' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  nota: string;
}

export class CrearPedidoDto {
  @ApiProperty({
    type: [PedidoItemDto],
    description: 'Ítems del carrito. Los precios NUNCA se reciben del cliente.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  items: PedidoItemDto[];

  @ApiPropertyOptional({
    type: [NotaEmprendimientoDto],
    description: 'Nota opcional por emprendimiento (RF-PED-02)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaEmprendimientoDto)
  notasPorEmprendimiento?: NotaEmprendimientoDto[];

  @ApiPropertyOptional({ description: 'Nota general aplicada a los emprendimientos sin nota propia' })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  notaComprador?: string;
}

export class ActualizarEstadoPedidoDto {
  @ApiProperty({ enum: EstadoPedido, example: EstadoPedido.CONFIRMADO })
  @IsEnum(EstadoPedido)
  estado: EstadoPedido;
}

export class ListarPedidosQueryDto {
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

  @ApiPropertyOptional({ enum: EstadoPedido })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;
}
