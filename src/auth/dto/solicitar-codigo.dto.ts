import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, Matches } from 'class-validator';

export const TELEFONO_E164 = /^\+[1-9]\d{7,14}$/;
export const trimTransform = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SolicitarCodigoDto {
  @ApiProperty({ example: '+593991234567', description: 'Teléfono en formato E.164' })
  @Transform(trimTransform)
  @Matches(TELEFONO_E164, { message: 'telefono debe estar en formato E.164 (ej. +593991234567)' })
  telefono: string;

  @ApiProperty({ enum: ['registro', 'login'] })
  @IsIn(['registro', 'login'])
  proposito: 'registro' | 'login';
}

export class CodigoSolicitadoDto {
  @ApiProperty({ example: 600, description: 'Segundos hasta que expire el código' })
  expiraEnSegundos: number;

  @ApiProperty({ description: 'Fecha/hora UTC de expiración' })
  fechaExpiracion: Date;

  @ApiProperty({
    example: 'https://wa.me/593999999999?text=Mi%20c%C3%B3digo%20de%20verificaci%C3%B3n%20es%20123456',
    description: 'Enlace wa.me de verificación inversa',
  })
  enlaceWhatsapp: string;

  @ApiProperty()
  mensaje: string;
}
