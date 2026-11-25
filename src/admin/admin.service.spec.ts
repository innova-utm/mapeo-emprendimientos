import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../common/auth/roles.guard.js';
import {
  AccionModeracion,
  EstadoEmprendimiento,
  EstadoReporte,
} from '../common/enums/index.js';
import { ModeracionEmprendimiento } from '../confianza/entities/moderacion-emprendimiento.entity.js';
import { Reporte } from '../confianza/entities/reporte.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

describe('AdminService - moderarEmprendimiento', () => {
  let manager: any;
  let dataSource: any;
  let service: AdminService;

  const ADMIN_ID = 'admin-1';
  const EMP_ID = 'emp-1';
  const REPORTE_ID = 'rep-1';

  beforeEach(() => {
    manager = {
      findOne: vi.fn(),
      create: vi.fn((_entity: unknown, v: any) => v),
      save: vi.fn(async (_entity: unknown, v: any) => ({
        id: 'mod-1',
        fechaModeracion: new Date(),
        ...v,
      })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      transaction: vi.fn((cb: any) => cb(manager)),
      query: vi.fn(),
    };

    service = new AdminService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
    );
  });

  it('ejecuta suspensión en transacción: registra moderación, suspende tienda y cierra reporte si se solicita', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: EMP_ID, estado: EstadoEmprendimiento.ACTIVO })
      .mockResolvedValueOnce({ id: REPORTE_ID, emprendimientoId: EMP_ID });

    const res = await service.moderarEmprendimiento(ADMIN_ID, EMP_ID, {
      accion: AccionModeracion.SUSPENSION,
      motivo: 'Incumplimiento reiterado reportado por compradores',
      reporteId: REPORTE_ID,
      cerrarReporte: true,
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledWith(
      ModeracionEmprendimiento,
      expect.objectContaining({
        emprendimientoId: EMP_ID,
        administradorId: ADMIN_ID,
        reporteId: REPORTE_ID,
        accion: AccionModeracion.SUSPENSION,
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      Emprendimiento,
      { id: EMP_ID },
      { estado: EstadoEmprendimiento.SUSPENDIDO },
    );
    expect(manager.update).toHaveBeenCalledWith(
      Reporte,
      { id: REPORTE_ID },
      expect.objectContaining({
        estado: EstadoReporte.RESUELTO,
        resueltoPor: ADMIN_ID,
        fechaResolucion: expect.any(Date),
      }),
    );
    expect(res.estadoEmprendimientoActual).toBe(EstadoEmprendimiento.SUSPENDIDO);
    expect(res.reporteCerrado).toBe(true);
  });

  it('reactivación cambia el estado del emprendimiento a activo sin cerrar reporte no solicitado', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: EMP_ID,
      estado: EstadoEmprendimiento.SUSPENDIDO,
    });

    const res = await service.moderarEmprendimiento(ADMIN_ID, EMP_ID, {
      accion: AccionModeracion.REACTIVACION,
      motivo: 'El emprendedor subsanó los reclamos pendientes',
    });

    expect(manager.update).toHaveBeenCalledWith(
      Emprendimiento,
      { id: EMP_ID },
      { estado: EstadoEmprendimiento.ACTIVO },
    );
    expect(res.estadoEmprendimientoActual).toBe(EstadoEmprendimiento.ACTIVO);
    expect(res.reporteCerrado).toBe(false);
  });

  it('advertencia registra el evento sin alterar el estado del emprendimiento', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: EMP_ID,
      estado: EstadoEmprendimiento.ACTIVO,
    });

    const res = await service.moderarEmprendimiento(ADMIN_ID, EMP_ID, {
      accion: AccionModeracion.ADVERTENCIA,
      motivo: 'Primer llamado de atención por horarios desactualizados',
    });

    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(manager.update).not.toHaveBeenCalled();
    expect(res.estadoEmprendimientoActual).toBe(EstadoEmprendimiento.ACTIVO);
  });

  it('rechaza si el reporte vinculado pertenece a otro emprendimiento', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: EMP_ID, estado: EstadoEmprendimiento.ACTIVO })
      .mockResolvedValueOnce({ id: REPORTE_ID, emprendimientoId: 'otro-emp' });

    await expect(
      service.moderarEmprendimiento(ADMIN_ID, EMP_ID, {
        accion: AccionModeracion.SUSPENSION,
        motivo: 'Motivo de prueba',
        reporteId: REPORTE_ID,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza con 404 si el emprendimiento no existe', async () => {
    manager.findOne.mockResolvedValueOnce(null);

    await expect(
      service.moderarEmprendimiento(ADMIN_ID, EMP_ID, {
        accion: AccionModeracion.SUSPENSION,
        motivo: 'Motivo',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AdminController - protección de rutas administrativas', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = AdminController.prototype as unknown as Record<string, () => void>;

  function crearContexto(handler: () => void, user?: { id: string; rol: string }): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => AdminController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  const rutasAdmin = [
    'crearCategoriaEmprendimiento',
    'actualizarCategoriaEmprendimiento',
    'crearCategoriaProducto',
    'actualizarCategoriaProducto',
    'crearDocumentoLegal',
    'actualizarDocumentoLegal',
    'listarReportes',
    'actualizarReporte',
    'listarEmprendimientos',
    'moderarEmprendimiento',
    'estadisticasResumen',
    'estadisticasDistribucion',
  ];

  it.each(rutasAdmin)('permite %s solo al rol administrador', (metodo) => {
    const handler = proto[metodo];
    expect(
      guard.canActivate(crearContexto(handler, { id: 'admin-1', rol: 'administrador' })),
    ).toBe(true);

    expect(() =>
      guard.canActivate(crearContexto(handler, { id: 'u-1', rol: 'consumidor' })),
    ).toThrow(ForbiddenException);

    expect(() =>
      guard.canActivate(crearContexto(handler, { id: 'u-2', rol: 'emprendedor' })),
    ).toThrow(ForbiddenException);

    expect(() => guard.canActivate(crearContexto(handler))).toThrow(ForbiddenException);
  });
});
