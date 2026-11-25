import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './decorators.js';
import { RolesGuard } from './roles.guard.js';

class Dummy {
  @Roles('administrador')
  soloAdmin() {}

  @Roles('consumidor', 'emprendedor')
  clientes() {}

  libre() {}
}

function contexto(handler: () => void, user?: { id: string; rol: string }): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => Dummy,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = Dummy.prototype as Record<string, () => void>;

  it('permite el rol autorizado', () => {
    expect(guard.canActivate(contexto(proto.soloAdmin, { id: '1', rol: 'administrador' }))).toBe(true);
    expect(guard.canActivate(contexto(proto.clientes, { id: '1', rol: 'emprendedor' }))).toBe(true);
  });

  it('rechaza roles no autorizados', () => {
    expect(() => guard.canActivate(contexto(proto.soloAdmin, { id: '1', rol: 'consumidor' }))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contexto(proto.clientes, { id: '1', rol: 'administrador' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rechaza si no hay usuario autenticado', () => {
    expect(() => guard.canActivate(contexto(proto.soloAdmin))).toThrow(ForbiddenException);
  });

  it('permite rutas sin @Roles', () => {
    expect(guard.canActivate(contexto(proto.libre, { id: '1', rol: 'consumidor' }))).toBe(true);
  });
});
