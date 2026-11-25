import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Canton } from './entities/canton.entity.js';
import { Parroquia } from './entities/parroquia.entity.js';
import { Provincia } from './entities/provincia.entity.js';
import { GeografiaController } from './geografia.controller.js';
import { GeografiaService } from './geografia.service.js';

describe('GeografiaController', () => {
  let controller: GeografiaController;
  let provinciaFind: ReturnType<typeof vi.fn>;
  let provinciaExistsBy: ReturnType<typeof vi.fn>;
  let cantonFind: ReturnType<typeof vi.fn>;
  let cantonExistsBy: ReturnType<typeof vi.fn>;
  let parroquiaFind: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    provinciaFind = vi.fn();
    provinciaExistsBy = vi.fn();
    cantonFind = vi.fn();
    cantonExistsBy = vi.fn();
    parroquiaFind = vi.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [GeografiaController],
      providers: [
        GeografiaService,
        {
          provide: getRepositoryToken(Provincia),
          useValue: { find: provinciaFind, existsBy: provinciaExistsBy },
        },
        {
          provide: getRepositoryToken(Canton),
          useValue: { find: cantonFind, existsBy: cantonExistsBy },
        },
        {
          provide: getRepositoryToken(Parroquia),
          useValue: { find: parroquiaFind },
        },
      ],
    }).compile();

    controller = moduleRef.get<GeografiaController>(GeografiaController);
  });

  it('debe listar las provincias ordenadas alfabéticamente', async () => {
    const provincias = [{ id: '11111111-1111-4111-8111-111111111111', nombre: 'Manabí' }];
    provinciaFind.mockResolvedValueOnce(provincias);

    const result = await controller.getProvincias();

    expect(provinciaFind).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
    expect(result).toEqual(provincias);
  });

  it('debe listar los cantones de una provincia existente', async () => {
    const provinciaId = '11111111-1111-4111-8111-111111111111';
    const cantones = [
      { id: '22222222-2222-4222-8222-222222222222', provinciaId, nombre: 'Portoviejo' },
    ];
    provinciaExistsBy.mockResolvedValueOnce(true);
    cantonFind.mockResolvedValueOnce(cantones);

    const result = await controller.getCantonesByProvincia(provinciaId);

    expect(provinciaExistsBy).toHaveBeenCalledWith({ id: provinciaId });
    expect(cantonFind).toHaveBeenCalledWith({
      where: { provinciaId },
      order: { nombre: 'ASC' },
    });
    expect(result).toEqual(cantones);
  });

  it('debe lanzar NotFoundException si la provincia no existe', async () => {
    const provinciaId = '11111111-1111-4111-8111-111111111111';
    provinciaExistsBy.mockResolvedValueOnce(false);

    await expect(controller.getCantonesByProvincia(provinciaId)).rejects.toThrow(NotFoundException);
  });

  it('debe listar las parroquias de un cantón existente', async () => {
    const cantonId = '22222222-2222-4222-8222-222222222222';
    const parroquias = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        cantonId,
        nombre: 'Crucita',
        tipo: 'rural',
      },
    ];
    cantonExistsBy.mockResolvedValueOnce(true);
    parroquiaFind.mockResolvedValueOnce(parroquias);

    const result = await controller.getParroquiasByCanton(cantonId);

    expect(cantonExistsBy).toHaveBeenCalledWith({ id: cantonId });
    expect(parroquiaFind).toHaveBeenCalledWith({
      where: { cantonId },
      order: { nombre: 'ASC' },
    });
    expect(result).toEqual(parroquias);
  });

  it('debe lanzar NotFoundException si el cantón no existe', async () => {
    const cantonId = '22222222-2222-4222-8222-222222222222';
    cantonExistsBy.mockResolvedValueOnce(false);

    await expect(controller.getParroquiasByCanton(cantonId)).rejects.toThrow(NotFoundException);
  });
});
