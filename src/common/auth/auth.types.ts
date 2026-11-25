import type { Request } from 'express';

export const ROLES = ['consumidor', 'emprendedor', 'administrador'] as const;
export type NombreRol = (typeof ROLES)[number];

export type TipoToken = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  rol: NombreRol;
  type: TipoToken;
}

export interface UsuarioAutenticado {
  id: string;
  rol: NombreRol;
}

export type AuthenticatedRequest = Request & { user?: UsuarioAutenticado };
