import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EstadoPedido } from '../common/enums/index.js';
import { ResenasService } from './resenas.service.js';

describe('ResenasService', () => {
  let resenaRepo: any;
  let pedidoRepo: any;
  let empRepo: any;
  let service: ResenasService;

  const USER_ID = 'user-1';
  const EMP_ID = 'emp-1';
  const PEDIDO_ID = 'ped-1';

  beforeEach(() => {
    resenaRepo = {
      findOne: vi.fn(),
      create: vi.fn((v: any) => v),
      save: vi.fn(async (v: any) => ({
        id: 'res-1',
        fechaCreacion: new Date(),
        fechaActualizacion: null,
        ...v,
      })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    pedidoRepo = { findOne: vi.fn() };
    empRepo = { exists: vi.fn().mockResolvedValue(true) };
    service = new ResenasService(resenaRepo, pedidoRepo, empRepo);
  });

  it('rechaza con 404 si el pedido no existe', async () => {
    pedidoRepo.findOne.mockResolvedValue(null);

    await expect(
      service.crear(USER_ID, { pedidoId: PEDIDO_ID, valoracion: 5 }),
    ).rejects.toThrow(NotFoundException);
    expect(resenaRepo.save).not.toHaveBeenCalled();
  });

  it('bloquea con 403 si el pedido no pertenece al usuario autenticado', async () => {
    pedidoRepo.findOne.mockResolvedValue({
      id: PEDIDO_ID,
      usuarioId: 'otro-usuario',
      emprendimientoId: EMP_ID,
      estado: EstadoPedido.ENTREGADO,
      compradorConfirmoRecepcion: true,
    });

    await expect(
      service.crear(USER_ID, { pedidoId: PEDIDO_ID, valoracion: 5 }),
    ).rejects.toThrow(ForbiddenException);
    expect(resenaRepo.save).not.toHaveBeenCalled();
  });

  it('bloquea con 400 si el pedido no está entregado ni confirmado por el comprador', async () => {
    pedidoRepo.findOne.mockResolvedValue({
      id: PEDIDO_ID,
      usuarioId: USER_ID,
      emprendimientoId: EMP_ID,
      estado: EstadoPedido.PREPARANDO,
      compradorConfirmoRecepcion: false,
    });

    await expect(
      service.crear(USER_ID, { pedidoId: PEDIDO_ID, valoracion: 4 }),
    ).rejects.toThrow(BadRequestException);
    expect(resenaRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si ya existe una reseña para ese pedido (unicidad)', async () => {
    pedidoRepo.findOne.mockResolvedValue({
      id: PEDIDO_ID,
      usuarioId: USER_ID,
      emprendimientoId: EMP_ID,
      estado: EstadoPedido.ENTREGADO,
      compradorConfirmoRecepcion: false,
    });
    resenaRepo.findOne.mockResolvedValue({ id: 'res-existente', pedidoId: PEDIDO_ID });

    await expect(
      service.crear(USER_ID, { pedidoId: PEDIDO_ID, valoracion: 5 }),
    ).rejects.toThrow(ConflictException);
    expect(resenaRepo.save).not.toHaveBeenCalled();
  });

  it('crea reseña respetando la FK compuesta cuando el pedido está entregado o confirmado', async () => {
    pedidoRepo.findOne.mockResolvedValue({
      id: PEDIDO_ID,
      usuarioId: USER_ID,
      emprendimientoId: EMP_ID,
      estado: EstadoPedido.CONFIRMADO,
      compradorConfirmoRecepcion: true,
    });
    resenaRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'res-1',
        pedidoId: PEDIDO_ID,
        usuarioId: USER_ID,
        emprendimientoId: EMP_ID,
        valoracion: 5,
        comentario: 'Excelente',
        fechaCreacion: new Date(),
        fechaActualizacion: null,
        usuario: { nombres: 'Ana', apellidos: 'Vera' },
      });

    const result = await service.crear(USER_ID, {
      pedidoId: PEDIDO_ID,
      valoracion: 5,
      comentario: 'Excelente',
    });

    expect(resenaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        pedidoId: PEDIDO_ID,
        usuarioId: USER_ID,
        emprendimientoId: EMP_ID,
        valoracion: 5,
        comentario: 'Excelente',
      }),
    );
    expect(result.autorNombre).toBe('Ana Vera');
    expect(result.valoracion).toBe(5);
  });

  it('solo permite editar la reseña al autor', async () => {
    resenaRepo.findOne.mockResolvedValue({
      id: 'res-1',
      usuarioId: 'autor-original',
      valoracion: 4,
      comentario: 'Bien',
    });

    await expect(
      service.actualizar(USER_ID, 'res-1', { valoracion: 2 }),
    ).rejects.toThrow(ForbiddenException);
    expect(resenaRepo.update).not.toHaveBeenCalled();
  });
});
