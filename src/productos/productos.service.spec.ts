import { BadRequestException } from '@nestjs/common';
import { EstadoRegistro } from '../common/enums/index.js';
import { ProductosService, validarPrecioPresentacion } from './productos.service.js';

describe('validarPrecioPresentacion (RNF-06 / chk_presentaciones_precio)', () => {
  it('exige precio cuando no requiere cotización', () => {
    expect(() => validarPrecioPresentacion(false, undefined)).toThrow(BadRequestException);
    expect(() => validarPrecioPresentacion(false, null)).toThrow(BadRequestException);
  });

  it('rechaza precios negativos', () => {
    expect(() => validarPrecioPresentacion(false, -1)).toThrow(BadRequestException);
    expect(() => validarPrecioPresentacion(true, -0.5)).toThrow(BadRequestException);
  });

  it('acepta precio 0 y normaliza a 2 decimales', () => {
    expect(validarPrecioPresentacion(false, 0)).toBe('0.00');
    expect(validarPrecioPresentacion(false, 5.5)).toBe('5.50');
  });

  it('permite precio nulo cuando requiere cotización', () => {
    expect(validarPrecioPresentacion(true, undefined)).toBeNull();
  });
});

describe('ProductosService.crearPresentacion', () => {
  const EMP = { id: 'emp-1' };
  let presentacionRepo: any;
  let service: ProductosService;

  beforeEach(() => {
    presentacionRepo = {
      create: vi.fn((x: unknown) => x),
      save: vi.fn(async (x: any) => ({ id: 'pr-1', ...x })),
    };
    const productoRepo: any = { findOne: vi.fn().mockResolvedValue({ id: 'prod-1' }) };
    const emprendimientoRepo: any = { findOne: vi.fn().mockResolvedValue(EMP) };
    service = new ProductosService(
      productoRepo,
      presentacionRepo,
      {} as any,
      {} as any,
      emprendimientoRepo,
      {} as any,
      {} as any,
    );
  });

  it('crea presentación con precio y otra a cotizar', async () => {
    const a = await service.crearPresentacion('u', 'prod-1', {
      nombre: '250 g',
      requiereCotizacion: false,
      precio: 4,
    });
    const b = await service.crearPresentacion('u', 'prod-1', {
      nombre: 'Mayorista',
      requiereCotizacion: true,
    });
    expect(a.precio).toBe(4);
    expect(b.precio).toBeNull();
    expect(b.requiereCotizacion).toBe(true);
    expect(a.estado).toBe(EstadoRegistro.ACTIVO);
  });

  it('rechaza sin precio si no requiere cotización', async () => {
    await expect(
      service.crearPresentacion('u', 'prod-1', { nombre: 'x', requiereCotizacion: false }),
    ).rejects.toThrow(BadRequestException);
    expect(presentacionRepo.save).not.toHaveBeenCalled();
  });
});
