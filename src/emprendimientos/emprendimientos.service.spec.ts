import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EstadoEmprendimiento, EstadoRegistro } from '../common/enums/index.js';
import { EmprendimientosService, generarSlugBase } from './emprendimientos.service.js';

describe('EmprendimientosService', () => {
  let emprendimientoRepo: any;
  let categoriaRepo: any;
  let redSocialRepo: any;
  let imagenRepo: any;
  let ubicacionRepo: any;
  let manager: any;
  let dataSource: any;
  let storageService: any;
  let service: EmprendimientosService;

  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const CAT_ID = '22222222-2222-4222-8222-222222222222';
  const EMP_ID = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    emprendimientoRepo = {
      findOne: vi.fn(),
      save: vi.fn(async (e: unknown) => e),
    };
    categoriaRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: CAT_ID,
        nombre: 'Gastronomía',
        estado: EstadoRegistro.ACTIVO,
      }),
    };
    redSocialRepo = { findOne: vi.fn(), create: vi.fn((x: unknown) => x), save: vi.fn(), delete: vi.fn() };
    imagenRepo = { findOne: vi.fn(), delete: vi.fn() };

    const qbUbicaciones = {
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([]),
    };
    ubicacionRepo = { createQueryBuilder: vi.fn(() => qbUbicaciones) };

    manager = {
      findOne: vi.fn(),
      exists: vi.fn(),
      create: vi.fn((_: unknown, v: unknown) => v),
      save: vi.fn(async (_: unknown, v: any) => ({ ...v, id: EMP_ID })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    const qbResenas = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({ promedio: '0', total: 0 }),
    };

    dataSource = {
      transaction: vi.fn((cb: any) => cb(manager)),
      createQueryBuilder: vi.fn(() => qbResenas),
    };

    storageService = {
      subirImagen: vi.fn(),
      eliminarArchivo: vi.fn(),
    };

    service = new EmprendimientosService(
      emprendimientoRepo,
      categoriaRepo,
      redSocialRepo,
      imagenRepo,
      ubicacionRepo,
      dataSource,
      storageService,
    );
  });

  describe('generarSlugBase', () => {
    it('normaliza tildes, eñes, mayúsculas y espacios', () => {
      expect(generarSlugBase('Café Manabí & Ñoquis 100%!')).toBe('cafe-manabi-noquis-100');
    });
  });

  describe('crear (regla 1:1)', () => {
    it('rechaza con ConflictException si el usuario ya posee un emprendimiento', async () => {
      manager.findOne.mockResolvedValueOnce({ id: USER_ID, telefono: '+593991234567' });
      manager.exists.mockResolvedValueOnce(true);

      await expect(
        service.crear(USER_ID, {
          categoriaId: CAT_ID,
          nombre: 'Mi Segunda Tienda',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('crea emprendimiento activo, genera slug único y actualiza rol a emprendedor', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: USER_ID, telefono: '+593991234567' })
        .mockResolvedValueOnce({ id: CAT_ID, nombre: 'Gastronomía', estado: EstadoRegistro.ACTIVO })
        .mockResolvedValueOnce({ id: 'rol-emp', nombre: 'emprendedor' });
      manager.exists
        .mockResolvedValueOnce(false) // usuario no tiene emprendimiento
        .mockResolvedValueOnce(true) // slug base ya ocupado
        .mockResolvedValueOnce(false); // slug-2 libre

      emprendimientoRepo.findOne.mockResolvedValueOnce({
        id: EMP_ID,
        usuarioId: USER_ID,
        categoriaId: CAT_ID,
        nombre: 'Café Manabí',
        slug: 'cafe-manabi-2',
        descripcion: null,
        historia: null,
        telefonoWhatsapp: '+593991234567',
        estado: EstadoEmprendimiento.ACTIVO,
        categoria: { id: CAT_ID, nombre: 'Gastronomía' },
        redesSociales: [],
        imagenes: [],
        fechaCreacion: new Date(),
        fechaActualizacion: null,
      });

      const detalle = await service.crear(USER_ID, {
        categoriaId: CAT_ID,
        nombre: 'Café Manabí',
      });

      const creado = manager.create.mock.calls[0][1];
      expect(creado).toMatchObject({
        usuarioId: USER_ID,
        slug: 'cafe-manabi-2',
        telefonoWhatsapp: '+593991234567',
        estado: EstadoEmprendimiento.ACTIVO,
      });
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: USER_ID },
        { rolId: 'rol-emp' },
      );
      expect(detalle.slug).toBe('cafe-manabi-2');
    });
  });

  describe('actualizarMiEmprendimiento (bloqueo de suspendido)', () => {
    it('rechaza con 403 Forbidden la reactivación si el emprendimiento está suspendido', async () => {
      emprendimientoRepo.findOne.mockResolvedValueOnce({
        id: EMP_ID,
        usuarioId: USER_ID,
        categoriaId: CAT_ID,
        estado: EstadoEmprendimiento.SUSPENDIDO,
      });

      await expect(
        service.actualizarMiEmprendimiento(USER_ID, { estado: EstadoEmprendimiento.ACTIVO }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(emprendimientoRepo.save).not.toHaveBeenCalled();
    });

    it('permite alternar entre activo e inactivo cuando no está suspendido', async () => {
      const entidad = {
        id: EMP_ID,
        usuarioId: USER_ID,
        categoriaId: CAT_ID,
        nombre: 'Tienda',
        slug: 'tienda',
        descripcion: null,
        historia: null,
        telefonoWhatsapp: '+593991234567',
        estado: EstadoEmprendimiento.ACTIVO,
        categoria: { id: CAT_ID, nombre: 'Gastronomía' },
        redesSociales: [],
        imagenes: [],
        fechaCreacion: new Date(),
        fechaActualizacion: null,
      };
      emprendimientoRepo.findOne.mockResolvedValue(entidad);

      await service.actualizarMiEmprendimiento(USER_ID, { estado: EstadoEmprendimiento.INACTIVO });
      expect(emprendimientoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoEmprendimiento.INACTIVO }),
      );
    });
  });

  describe('marcarImagenPrincipal', () => {
    it('desmarca las demás imágenes antes de marcar la elegida dentro de una transacción', async () => {
      emprendimientoRepo.findOne.mockResolvedValueOnce({ id: EMP_ID, usuarioId: USER_ID });
      manager.findOne.mockResolvedValueOnce({
        id: 'img-2',
        emprendimientoId: EMP_ID,
        url: '/uploads/emprendimientos/img-2.webp',
        esPrincipal: false,
        fechaCreacion: new Date(),
      });

      const resultado = await service.marcarImagenPrincipal(USER_ID, 'img-2');

      expect(manager.update).toHaveBeenCalledTimes(2);
      expect(manager.update.mock.calls[0][1]).toEqual({
        emprendimientoId: EMP_ID,
        esPrincipal: true,
      });
      expect(manager.update.mock.calls[0][2]).toEqual({ esPrincipal: false });
      expect(manager.update.mock.calls[1][1]).toEqual({
        id: 'img-2',
        emprendimientoId: EMP_ID,
      });
      expect(manager.update.mock.calls[1][2]).toEqual({ esPrincipal: true });
      expect(resultado.esPrincipal).toBe(true);
    });
  });
});
