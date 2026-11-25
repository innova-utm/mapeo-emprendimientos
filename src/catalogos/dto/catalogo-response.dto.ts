import { ApiProperty } from '@nestjs/swagger';
import { EstadoRegistro } from '../../common/enums/index.js';

export class CategoriaCatalogoDto {
  @ApiProperty({ example: '7b5c9f9e-5b1b-4c59-9c9a-3e0d3d48c111', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Gastronomía y Comida Típica' })
  nombre: string;

  @ApiProperty({
    example: 'Restaurantes, huecas, comida manabita, sierra y platos tradicionales.',
    nullable: true,
  })
  descripcion: string | null;

  @ApiProperty({ enum: EstadoRegistro, example: EstadoRegistro.ACTIVO })
  estado: EstadoRegistro;
}

export class DocumentoLegalDto {
  @ApiProperty({ example: '1d3c9f9e-5b1b-4c59-9c9a-3e0d3d48c222', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Términos y Condiciones de Uso' })
  nombre: string;

  @ApiProperty({ example: 'terminos' })
  tipo: string;

  @ApiProperty({ example: '1.0' })
  version: string;

  @ApiProperty({ example: 'https://plataformamapeo.ec/legal/terminos-v1.0' })
  contenidoUrl: string;

  @ApiProperty({ enum: EstadoRegistro, example: EstadoRegistro.ACTIVO })
  estado: EstadoRegistro;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    nullable: true,
  })
  fechaPublicacion: Date | null;
}
