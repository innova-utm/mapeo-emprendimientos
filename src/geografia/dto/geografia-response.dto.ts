import { ApiProperty } from '@nestjs/swagger';

export class ProvinciaResponseDto {
  @ApiProperty({ example: '8b5c9f9e-5b1b-4c59-9c9a-3e0d3d48c333', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Manabí' })
  nombre: string;
}

export class CantonResponseDto {
  @ApiProperty({ example: '9b5c9f9e-5b1b-4c59-9c9a-3e0d3d48c444', format: 'uuid' })
  id: string;

  @ApiProperty({ example: '8b5c9f9e-5b1b-4c59-9c9a-3e0d3d48c333', format: 'uuid' })
  provinciaId: string;

  @ApiProperty({ example: 'Portoviejo' })
  nombre: string;
}

export class ParroquiaResponseDto {
  @ApiProperty({ example: 'ab5c9f9e-5b1b-4c59-9c9a-3e0d3d48c555', format: 'uuid' })
  id: string;

  @ApiProperty({ example: '9b5c9f9e-5b1b-4c59-9c9a-3e0d3d48c444', format: 'uuid' })
  cantonId: string;

  @ApiProperty({ example: 'Crucita' })
  nombre: string;

  @ApiProperty({ example: 'rural', description: 'Tipo de parroquia (urbana o rural)' })
  tipo: string;
}
