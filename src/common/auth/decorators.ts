import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthenticatedRequest, NombreRol, UsuarioAutenticado } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Marca un controlador o ruta como pública (omite JwtAuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe el acceso a los roles indicados (verificado en servidor por RolesGuard). */
export const Roles = (...roles: NombreRol[]) => SetMetadata(ROLES_KEY, roles);

/** Extrae el usuario autenticado (o una de sus propiedades) del request. */
export const CurrentUser = createParamDecorator(
  (data: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return data && user ? user[data] : user;
  },
);
