import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CategoriaResumenDto,
  TerritorioRefDto,
} from '../../emprendimientos/dto/emprendimiento-response.dto.js';

export class MapaEmprendimientoResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Café Manabí de Altura' })
  nombre: string;

  @ApiProperty({ example: 'cafe-manabi-de-altura' })
  slug: string;

  @ApiProperty({ type: CategoriaResumenDto })
  categoria: CategoriaResumenDto;

  @ApiPropertyOptional({ nullable: true, example: '/uploads/emprendimientos/uuid.webp' })
  imagenPrincipal: string | null;
}

export class MapaMarcadorDto {
  @ApiProperty({ format: 'uuid' })
  ubicacionId: string;

  @ApiPropertyOptional({ nullable: true, example: 'Local Matriz Portoviejo' })
  nombreSucursal: string | null;

  @ApiProperty({ example: 'Av. Manabí y Calle Ramos Iduarte' })
  direccion: string;

  @ApiPropertyOptional({ nullable: true, example: 'Frente al Parque Las Vegas' })
  referencia: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Lun-Sáb 09:00 a 18:00' })
  horarioTexto: string | null;

  @ApiProperty({ example: -1.0546 })
  latitud: number;

  @ApiProperty({ example: -80.4545 })
  longitud: number;

  @ApiPropertyOptional({
    nullable: true,
    example: 1.24,
    description: 'Distancia aproximada en kilómetros desde lat/lng (si fueron enviados)',
  })
  distanciaKm: number | null;

  @ApiProperty({ type: TerritorioRefDto })
  provincia: TerritorioRefDto;

  @ApiProperty({ type: TerritorioRefDto })
  canton: TerritorioRefDto;

  @ApiPropertyOptional({ type: TerritorioRefDto, nullable: true })
  parroquia: TerritorioRefDto | null;

  @ApiProperty({ type: MapaEmprendimientoResumenDto })
  emprendimiento: MapaEmprendimientoResumenDto;
}
