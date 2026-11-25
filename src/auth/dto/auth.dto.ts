import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { TELEFONO_E164, trimTransform } from './solicitar-codigo.dto.js';

export class RegistroDto {
  @ApiProperty({ example: 'María', maxLength: 100 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez', maxLength: 100 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  @ApiProperty({ example: '+593991234567' })
  @Transform(trimTransform)
  @Matches(TELEFONO_E164, { message: 'telefono debe estar en formato E.164 (ej. +593991234567)' })
  telefono: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos' })
  @Transform(trimTransform)
  @Matches(/^\d{6}$/, { message: 'codigo debe tener 6 dígitos' })
  codigo: string;

  @ApiPropertyOptional({ example: 'maria@correo.com' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  correo?: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'IDs de todos los documentos legales activos (GET /catalogos/documentos-legales)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  documentos_aceptados_ids: string[];
}

export class LoginDto {
  @ApiProperty({ example: '+593991234567' })
  @Transform(trimTransform)
  @Matches(TELEFONO_E164, { message: 'telefono debe estar en formato E.164 (ej. +593991234567)' })
  telefono: string;

  @ApiProperty({ example: '123456' })
  @Transform(trimTransform)
  @Matches(/^\d{6}$/, { message: 'codigo debe tener 6 dígitos' })
  codigo: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@mapeo.local' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  correo: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  contrasena: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token emitido en login/registro' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tipo: string;

  @ApiProperty({ example: 900, description: 'Segundos de vigencia del accessToken' })
  expiraEnSegundos: number;
}
