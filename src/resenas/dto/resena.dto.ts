import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { trimTransform } from '../../auth/dto/solicitar-codigo.dto.js';

export class CreateResenaDto {
  @ApiProperty({ format: 'uuid', description: 'UUID del pedido entregado o confirmado' })
  @IsUUID('all')
  pedidoId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  valoracion: number;

  @ApiPropertyOptional({ example: 'Excelente atención y café recién tostado.', maxLength: 1000 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}

export class UpdateResenaDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  valoracion?: number;

  @ApiPropertyOptional({ example: 'Muy buen producto, entrega puntual.', maxLength: 1000 })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  comentario?: string | null;
}

export class ListarResenasQueryDto {
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
