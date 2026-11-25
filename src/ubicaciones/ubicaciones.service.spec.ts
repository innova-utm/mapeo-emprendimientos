import { BadRequestException } from '@nestjs/common';
import { EstadoRegistro } from '../common/enums/index.js';
import { esCoordenadaEnEcuador } from './ecuador-geo.util.js';
import { UbicacionesService } from './ubicaciones.service.js';

describe('UbicacionesService y límites de Ecuador', () => {
  let ubicacionRepo: any;
  let emprendimientoRepo: any;
  let cantonRepo: any;
  let parroquiaRepo: any;
  let service: UbicacionesService;

  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const EMP_ID = '22222222-2222-4222-8222-222222222222';
  const CANTON_ID = '33333333-3333-4333-8333-333333333333';
  const PARROQUIA_ID = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    ubicacionRepo = {
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn(),
    };
    emprendimientoRepo = {
      findOne: vi.fn().mockResolvedValue({ id: EMP_ID, usuarioId: USER_ID }),
    };
    cantonRepo = {
      existsBy: vi.fn().mockResolvedValue(true),
    };
    parroquiaRepo = {
      findOne: vi.fn(),
    };

    service = new UbicacionesService(ubicacionRepo, emprendimientoRepo, cantonRepo, parroquiaRepo);
  });

  describe('esCoordenadaEnEcuador', () => {
    it('acepta puntos dentro de Ecuador continental y Galápagos', () => {
      expect(esCoordenadaEnEcuador(-1.0546, -80.4545)).toBe(true); // Portoviejo
      expect(esCoordenadaEnEcuador(-0.1807, -78.4678)).toBe(true); // Quito
      expect(esCoordenadaEnEcuador(-2.1709, -79.9224)).toBe(true); // Guayaquil
      expect(esCoordenadaEnEcuador(-0.7433, -90.3133)).toBe(true); // Santa Cruz, Galápagos
    });

    it('rechaza coordenadas fuera de Ecuador', () => {
      expect(esCoordenadaEnEcuador(4.711, -74.0721)).toBe(false); // Bogotá
      expect(esCoordenadaEnEcuador(-12.0464, -77.0428)).toBe(false); // Lima
      expect(esCoordenadaEnEcuador(40.4168, -3.7038)).toBe(false); // Madrid
      expect(esCoordenadaEnEcuador(-1.0, -85.0)).toBe(false); // Océano entre continente y Galápagos
    });
  });

  describe('crear', () => {
    it('rechaza con BadRequestException coordenadas fuera de Ecuador sin consultar BD', async () => {
      await expect(
        service.crear(USER_ID, {
          cantonId: CANTON_ID,
          direccion: 'Calle Falsa 123',
          latitud: 40.4168,
          longitud: -3.7038,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(emprendimientoRepo.findOne).not.toHaveBeenCalled();
    });

    it('rechaza con BadRequestException si la parroquia no pertenece al cantón', async () => {
      parroquiaRepo.findOne.mockResolvedValueOnce({
        id: PARROQUIA_ID,
        cantonId: '99999999-9999-4999-8999-999999999999',
      });

      await expect(
        service.crear(USER_ID, {
          cantonId: CANTON_ID,
          parroquiaId: PARROQUIA_ID,
          direccion: 'Av. Manabí',
          latitud: -1.0546,
          longitud: -80.4545,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('eliminarLogico', () => {
    it('cambia estado a inactivo en lugar de eliminar físicamente', async () => {
      await service.eliminarLogico(USER_ID, 'ubi-1');

      expect(ubicacionRepo.update).toHaveBeenCalledWith(
        { id: 'ubi-1', emprendimientoId: EMP_ID },
        { estado: EstadoRegistro.INACTIVO },
      );
    });
  });
});
