import { BadRequestException } from '@nestjs/common';

export const ECUADOR_CONTINENTAL = {
  minLat: -5.1,
  maxLat: 1.5,
  minLng: -81.1,
  maxLng: -75.1,
} as const;

export const ECUADOR_GALAPAGOS = {
  minLat: -1.5,
  maxLat: 1.7,
  minLng: -92.1,
  maxLng: -89.2,
} as const;

/**
 * Valida si una coordenada (latitud, longitud) cae dentro de los límites geográficos
 * de la República del Ecuador (territorio continental o región insular de Galápagos).
 */
export function esCoordenadaEnEcuador(latitud: number, longitud: number): boolean {
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    return false;
  }

  const enContinental =
    latitud >= ECUADOR_CONTINENTAL.minLat &&
    latitud <= ECUADOR_CONTINENTAL.maxLat &&
    longitud >= ECUADOR_CONTINENTAL.minLng &&
    longitud <= ECUADOR_CONTINENTAL.maxLng;

  const enGalapagos =
    latitud >= ECUADOR_GALAPAGOS.minLat &&
    latitud <= ECUADOR_GALAPAGOS.maxLat &&
    longitud >= ECUADOR_GALAPAGOS.minLng &&
    longitud <= ECUADOR_GALAPAGOS.maxLng;

  return enContinental || enGalapagos;
}

export function validarCoordenadaEnEcuador(latitud: number, longitud: number): void {
  if (!esCoordenadaEnEcuador(latitud, longitud)) {
    throw new BadRequestException(
      'Las coordenadas deben ubicarse dentro de los límites geográficos de Ecuador (continental o Galápagos)',
    );
  }
}
