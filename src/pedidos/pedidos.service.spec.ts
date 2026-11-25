import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EstadoEmprendimiento, EstadoPedido, EstadoRegistro } from '../common/enums/index.js';
import { PedidosService } from './pedidos.service.js';
import { transicionPermitida } from './pedidos.utils.js';

const USER = 'user-1';

function presentacion(opts: {
  id: string;
  empId: string;
  empNombre: string;
  tel: string;
  precio: string | null;
  cotiza?: boolean;
  estado?: EstadoRegistro;
  productoEstado?: EstadoRegistro;
  empEstado?: EstadoEmprendimiento;
}) {
  return {
    id: opts.id,
    nombre: `Pres ${opts.id}`,
    precio: opts.precio,
    requiereCotizacion: opts.cotiza ?? false,
    estado: opts.estado ?? EstadoRegistro.ACTIVO,
    producto: {
      nombre: `Prod ${opts.id}`,
      estado: opts.productoEstado ?? EstadoRegistro.ACTIVO,
      emprendimientoId: opts.empId,
      emprendimiento: {
        id: opts.empId,
        nombre: opts.empNombre,
        telefonoWhatsapp: opts.tel,
        estado: opts.empEstado ?? EstadoEmprendimiento.ACTIVO,
      },
    },
  };
}

describe('PedidosService', () => {
  let manager: any;
  let dataSource: any;
  let pedidoRepo: any;
  let service: PedidosService;
  let contador: number;

  beforeEach(() => {
    contador = 0;
    manager = {
      find: vi.fn(),
      create: vi.fn((_: unknown, v: any) => v),
      save: vi.fn(async (_: unknown, v: any) =>
        Array.isArray(v) ? v.map((x, i) => ({ id: `d-${i}`, ...x })) : { id: `ped-${++contador}`, ...v },
      ),
      findOne: vi.fn(async (_: unknown, o: any) => ({
        id: o.where.id,
        codigoPedido: `PED-00000${o.where.id.split('-')[1]}`,
        fechaCreacion: new Date(),
        fechaActualizacion: null,
      })),
    };
    dataSource = { transaction: vi.fn((cb: any) => cb(manager)) };
    pedidoRepo = { findOne: vi.fn(), update: vi.fn().mockResolvedValue({ affected: 1 }) };
    service = new PedidosService(pedidoRepo, {} as any, dataSource);
  });

  describe('crear (carrito multivendedor)', () => {
    it('divide en N pedidos con snapshots, totales y enlaces wa.me', async () => {
      manager.find.mockResolvedValue([
        presentacion({ id: 'a', empId: 'e1', empNombre: 'Café', tel: '+593991111111', precio: '5.50' }),
        presentacion({ id: 'b', empId: 'e1', empNombre: 'Café', tel: '+593991111111', precio: null, cotiza: true }),
        presentacion({ id: 'c', empId: 'e2', empNombre: 'Quesos', tel: '+593992222222', precio: '10.00' }),
      ]);

      const res = await service.crear(USER, {
        items: [
          { presentacionId: 'a', cantidad: 2 },
          { presentacionId: 'b', cantidad: 1 },
          { presentacionId: 'c', cantidad: 3 },
        ],
        notasPorEmprendimiento: [{ emprendimientoId: 'e1', nota: 'Retiro tarde' }],
      });

      expect(res).toHaveLength(2);
      const [p1, p2] = res;
      expect(p1.codigoPedido).toBe('PED-000001');
      expect(p1.totalReferencial).toBe(11);
      expect(p1.tieneItemsPorCotizar).toBe(true);
      expect(p1.estado).toBe(EstadoPedido.NUEVO);
      expect(p1.whatsappUrl.startsWith('https://wa.me/593991111111?text=')).toBe(true);
      const texto = decodeURIComponent(p1.whatsappUrl.split('?text=')[1]);
      expect(texto).toContain('PED-000001');
      expect(texto).toContain('por cotizar');
      expect(texto).toContain('Nota: Retiro tarde');
      expect(p1.avisoSeguridad).toMatch(/no procesa pagos/);

      expect(p2.totalReferencial).toBe(30);
      expect(p2.tieneItemsPorCotizar).toBe(false);
      expect(p2.whatsappUrl).toContain('https://wa.me/593992222222');

      // Snapshots guardados en el pedido y en el detalle.
      const pedidosGuardados = manager.save.mock.calls.filter((c: any[]) => !Array.isArray(c[1]));
      expect(pedidosGuardados[0][1]).toMatchObject({
        nombreEmprendimientoSnapshot: 'Café',
        whatsappEmprendimientoSnapshot: '+593991111111',
        estado: EstadoPedido.NUEVO,
        totalReferencial: '11.00',
      });
      const detallesE1 = manager.save.mock.calls.find((c: any[]) => Array.isArray(c[1]))[1];
      expect(detallesE1[0]).toMatchObject({ nombreProducto: 'Prod a', precioUnitario: '5.50', cantidad: 2 });
      expect(detallesE1[1]).toMatchObject({ requiereCotizacion: true, precioUnitario: null });
    });

    it.each([
      ['presentación inactiva', { estado: EstadoRegistro.INACTIVO }],
      ['producto inactivo', { productoEstado: EstadoRegistro.INACTIVO }],
      ['emprendimiento suspendido', { empEstado: EstadoEmprendimiento.SUSPENDIDO }],
      ['emprendimiento inactivo', { empEstado: EstadoEmprendimiento.INACTIVO }],
    ])('rechaza %s', async (_n, extra) => {
      manager.find.mockResolvedValue([
        presentacion({ id: 'a', empId: 'e1', empNombre: 'X', tel: '+593991111111', precio: '1.00', ...extra }),
      ]);
      await expect(
        service.crear(USER, { items: [{ presentacionId: 'a', cantidad: 1 }] }),
      ).rejects.toThrow(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rechaza presentaciones inexistentes', async () => {
      manager.find.mockResolvedValue([]);
      await expect(
        service.crear(USER, { items: [{ presentacionId: 'zzz', cantidad: 1 }] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('máquina de estados', () => {
    it('permite solo transiciones válidas', () => {
      expect(transicionPermitida(EstadoPedido.NUEVO, EstadoPedido.CONFIRMADO)).toBe(true);
      expect(transicionPermitida(EstadoPedido.NUEVO, EstadoPedido.CANCELADO)).toBe(true);
      expect(transicionPermitida(EstadoPedido.CONFIRMADO, EstadoPedido.PREPARANDO)).toBe(true);
      expect(transicionPermitida(EstadoPedido.PREPARANDO, EstadoPedido.ENTREGADO)).toBe(true);
      expect(transicionPermitida(EstadoPedido.NUEVO, EstadoPedido.ENTREGADO)).toBe(false);
      expect(transicionPermitida(EstadoPedido.CONFIRMADO, EstadoPedido.NUEVO)).toBe(false);
      expect(transicionPermitida(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO)).toBe(false);
      expect(transicionPermitida(EstadoPedido.CANCELADO, EstadoPedido.NUEVO)).toBe(false);
    });

    const pedido = (estado: EstadoPedido, extra: object = {}) => ({
      id: 'p1',
      usuarioId: USER,
      estado,
      detalles: [],
      emprendimiento: { usuarioId: 'titular' },
      compradorConfirmoRecepcion: false,
      ...extra,
    });

    it('rechaza cambios sobre estados terminales con 400', async () => {
      pedidoRepo.findOne.mockResolvedValue(pedido(EstadoPedido.ENTREGADO));
      await expect(
        service.actualizarEstado('titular', 'p1', EstadoPedido.CANCELADO),
      ).rejects.toThrow(BadRequestException);
      expect(pedidoRepo.update).not.toHaveBeenCalled();
    });

    it('actualiza estado válido y prohíbe a no titulares', async () => {
      pedidoRepo.findOne.mockResolvedValue(pedido(EstadoPedido.NUEVO));
      await service.actualizarEstado('titular', 'p1', EstadoPedido.CONFIRMADO);
      expect(pedidoRepo.update).toHaveBeenCalledWith({ id: 'p1' }, { estado: EstadoPedido.CONFIRMADO });
      await expect(
        service.actualizarEstado('otro', 'p1', EstadoPedido.CONFIRMADO),
      ).rejects.toThrow(ForbiddenException);
    });

    it('bloquea confirmar recepción en pedidos cancelados', async () => {
      pedidoRepo.findOne.mockResolvedValue(pedido(EstadoPedido.CANCELADO));
      await expect(service.confirmarRecepcion(USER, 'p1')).rejects.toThrow(BadRequestException);
      expect(pedidoRepo.update).not.toHaveBeenCalled();
    });

    it('confirma recepción solo para el comprador', async () => {
      pedidoRepo.findOne.mockResolvedValue(pedido(EstadoPedido.ENTREGADO));
      await service.confirmarRecepcion(USER, 'p1');
      expect(pedidoRepo.update).toHaveBeenCalledWith(
        { id: 'p1' },
        { compradorConfirmoRecepcion: true, fechaConfirmacionComprador: expect.any(Date) },
      );
      await expect(service.confirmarRecepcion('otro', 'p1')).rejects.toThrow(ForbiddenException);
    });

    it('detalle: 403 si no es comprador ni titular', async () => {
      pedidoRepo.findOne.mockResolvedValue(pedido(EstadoPedido.NUEVO));
      await expect(service.obtenerDetalle('intruso', 'p1')).rejects.toThrow(ForbiddenException);
    });
  });
});
