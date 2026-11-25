import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { EstadoRegistro, EstadoUsuario, PropositoVerificacion } from '../common/enums/index.js';
import { AuthService, MAX_INTENTOS } from './auth.service.js';

const CONFIG: Record<string, unknown> = {
  'app.jwtSecret': 'a'.repeat(40),
  'app.jwtRefreshSecret': 'b'.repeat(40),
  'app.jwtAccessTtl': 900,
  'app.jwtRefreshTtl': 3600,
};
const TELEFONO = '+593991234567';

function crearCodigo(hash: string, extra: Record<string, unknown> = {}) {
  return {
    id: 'cod-1',
    destino: TELEFONO,
    codigoHash: hash,
    intentos: 0,
    fechaExpiracion: new Date(Date.now() + 5 * 60 * 1000),
    fechaUtilizacion: null,
    fechaCreacion: new Date(Date.now() - 120 * 1000),
    ...extra,
  };
}

describe('AuthService', () => {
  let usuarioRepo: any;
  let codigoRepo: any;
  let rolRepo: any;
  let documentoRepo: any;
  let manager: any;
  let dataSource: any;
  let whatsapp: any;
  let service: AuthService;

  const DOCS = [
    { id: '11111111-1111-4111-8111-111111111111', tipo: 'terminos', estado: EstadoRegistro.ACTIVO },
    { id: '22222222-2222-4222-8222-222222222222', tipo: 'privacidad', estado: EstadoRegistro.ACTIVO },
  ];

  beforeEach(() => {
    usuarioRepo = { findOne: vi.fn(), exists: vi.fn().mockResolvedValue(false) };
    codigoRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(async (x: unknown) => x),
      create: vi.fn((x: unknown) => x),
      increment: vi.fn(),
    };
    rolRepo = { findOne: vi.fn().mockResolvedValue({ id: 'rol-consumidor', nombre: 'consumidor' }) };
    documentoRepo = { find: vi.fn().mockResolvedValue(DOCS) };
    manager = {
      create: vi.fn((_: unknown, v: unknown) => v),
      save: vi.fn(async (x: any) => (Array.isArray(x) ? x : { ...x, id: 'user-1' })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = { transaction: vi.fn((cb: any) => cb(manager)), manager };
    whatsapp = {
      construirEnlaceVerificacion: vi.fn((c: string) => `https://wa.me/593?text=${c}`),
      enviarCodigo: vi.fn(),
      estaVerificado: vi.fn().mockReturnValue(true),
    };
    const config = { get: (k: string) => CONFIG[k], getOrThrow: (k: string) => CONFIG[k] };
    service = new AuthService(
      usuarioRepo,
      codigoRepo,
      rolRepo,
      documentoRepo,
      dataSource,
      new JwtService(),
      config as any,
      whatsapp,
    );
  });

  describe('generación de código', () => {
    it('genera códigos de 6 dígitos', () => {
      for (let i = 0; i < 200; i++) {
        expect(service.generarCodigo()).toMatch(/^\d{6}$/);
      }
    });

    it('guarda solo el hash, con expiración de 10 minutos, y envía el código', async () => {
      const antes = Date.now();
      const respuesta = await service.solicitarCodigo({ telefono: TELEFONO, proposito: 'registro' });

      const codigoEnviado: string = whatsapp.enviarCodigo.mock.calls[0][1];
      const guardado = codigoRepo.save.mock.calls[0][0];
      expect(codigoEnviado).toMatch(/^\d{6}$/);
      expect(guardado.codigoHash).not.toContain(codigoEnviado);
      expect(await bcrypt.compare(codigoEnviado, guardado.codigoHash)).toBe(true);
      expect(guardado.fechaExpiracion.getTime() - antes).toBeGreaterThanOrEqual(10 * 60 * 1000 - 50);
      expect(respuesta.expiraEnSegundos).toBe(600);
      expect(respuesta.enlaceWhatsapp).toContain(codigoEnviado);
    });

    it('aplica cooldown por teléfono (429)', async () => {
      codigoRepo.find.mockResolvedValue([{ fechaCreacion: new Date(Date.now() - 5000) }]);
      await expect(
        service.solicitarCodigo({ telefono: TELEFONO, proposito: 'registro' }),
      ).rejects.toMatchObject({ status: 429 });
      expect(codigoRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('validación de código', () => {
    it('acepta un código correcto', async () => {
      const hash = await bcrypt.hash('123456', 4);
      codigoRepo.findOne.mockResolvedValue(crearCodigo(hash));
      const r = await service.validarCodigo(TELEFONO, PropositoVerificacion.LOGIN, '123456');
      expect(r.id).toBe('cod-1');
      expect(codigoRepo.increment).not.toHaveBeenCalled();
    });

    it('incrementa intentos al fallar', async () => {
      const hash = await bcrypt.hash('123456', 4);
      codigoRepo.findOne.mockResolvedValue(crearCodigo(hash));
      await expect(
        service.validarCodigo(TELEFONO, PropositoForTest(), '000000'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(codigoRepo.increment).toHaveBeenCalledWith({ id: 'cod-1' }, 'intentos', 1);
    });

    it('rechaza códigos expirados', async () => {
      const hash = await bcrypt.hash('123456', 4);
      codigoRepo.findOne.mockResolvedValue(
        crearCodigo(hash, { fechaExpiracion: new Date(Date.now() - 1000) }),
      );
      await expect(
        service.validarCodigo(TELEFONO, PropositoForTest(), '123456'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it(`bloquea el código tras ${MAX_INTENTOS} intentos fallidos aunque el código sea correcto`, async () => {
      const hash = await bcrypt.hash('123456', 4);
      codigoRepo.findOne.mockResolvedValue(crearCodigo(hash, { intentos: MAX_INTENTOS }));
      const error = await service
        .validarCodigo(TELEFONO, PropositoForTest(), '123456')
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect(codigoRepo.increment).not.toHaveBeenCalled();
    });
  });

  describe('registro', () => {
    const base = {
      nombres: 'María',
      apellidos: 'Pérez',
      telefono: TELEFONO,
      codigo: '123456',
    };

    beforeEach(async () => {
      codigoRepo.findOne.mockResolvedValue(crearCodigo(await bcrypt.hash('123456', 4)));
    });

    it('exige aceptar todos los documentos legales activos', async () => {
      await expect(
        service.registro({ ...base, documentos_aceptados_ids: [DOCS[0].id] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rechaza documentos no vigentes', async () => {
      await expect(
        service.registro({
          ...base,
          documentos_aceptados_ids: [DOCS[0].id, DOCS[1].id, '33333333-3333-4333-8333-333333333333'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crea consumidor verificado, registra aceptaciones, consume el código y emite tokens', async () => {
      const tokens = await service.registro({
        ...base,
        documentos_aceptados_ids: DOCS.map((d) => d.id),
      });

      const usuarioCreado = manager.create.mock.calls[0][1];
      expect(usuarioCreado).toMatchObject({
        rolId: 'rol-consumidor',
        telefonoVerificado: true,
        estado: EstadoUsuario.ACTIVO,
      });
      expect(manager.save.mock.calls[1][0]).toHaveLength(2);
      expect(manager.update).toHaveBeenCalled();
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });

  describe('refresh', () => {
    it('rechaza un accessToken usado como refreshToken', async () => {
      codigoRepo.findOne.mockResolvedValue(crearCodigo(await bcrypt.hash('123456', 4)));
      usuarioRepo.findOne.mockResolvedValue({
        id: 'u1',
        estado: EstadoUsuario.ACTIVO,
        rol: { nombre: 'consumidor' },
      });
      const tokens = await service.login({ telefono: TELEFONO, codigo: '123456' });
      await expect(service.refresh(tokens.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
      const nuevos = await service.refresh(tokens.refreshToken);
      expect(nuevos.accessToken).toBeTruthy();
    });
  });
});

function PropositoForTest(): PropositoVerificacion {
  return PropositoVerificacion.LOGIN;
}
