import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import {
  AccionModeracion,
  EstadoEmprendimiento,
  EstadoPedido,
  MotivoReporte,
} from '../src/common/enums/index.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

function extraerCodigoOtp(enlaceWhatsapp: string): string {
  const url = new URL(enlaceWhatsapp);
  const text = url.searchParams.get('text') ?? '';
  const match = text.match(/(\d{6})$/);
  if (!match) {
    throw new Error(`No se pudo extraer código OTP de enlaceWhatsapp: ${enlaceWhatsapp}`);
  }
  return match[1];
}

describe('Plataforma de Emprendimientos - Suite E2E real (PostgreSQL 18 + PostGIS)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

  const sufijo = String(Date.now()).slice(-6);
  const telefonoVendedor = `+593981${sufijo}`;
  const telefonoComprador = `+593982${sufijo}`;

  // Estado compartido entre pasos secuenciales y limpieza en afterAll
  let documentosLegalesIds: string[] = [];
  let vendedorAccessToken = '';
  let vendedorRefreshToken = '';
  let vendedorId = '';
  let compradorAccessToken = '';
  let compradorId = '';
  let adminAccessToken = '';

  let emprendimientoId = '';
  let emprendimientoSlug = '';
  let ubicacionId = '';
  let productoId = '';
  let presentacionConPrecioId = '';
  let presentacionCotizableId = '';
  let pedidoId = '';
  let resenaId = '';
  let reporteId = '';
  let moderacionId = '';

  beforeAll(async () => {
    process.env.WHATSAPP_MODE = 'mock';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({ rawBody: true });

    const configService = app.get(ConfigService);
    const corsOrigins = configService.get<string[]>('app.corsOrigins', [
      'http://localhost:8100',
      'http://localhost:4200',
      'capacitor://localhost',
      'http://localhost',
    ]);

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );

    app.enableCors({
      origin: corsOrigins,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      const telefonos = [telefonoVendedor, telefonoComprador];
      const userIds = [vendedorId, compradorId].filter(Boolean);

      await dataSource.transaction(async (manager) => {
        if (moderacionId || emprendimientoId) {
          await manager.query(
            `DELETE FROM moderaciones_emprendimiento WHERE id = $1 OR emprendimiento_id = $2`,
            [moderacionId || null, emprendimientoId || null],
          );
        }
        if (reporteId || emprendimientoId) {
          await manager.query(
            `DELETE FROM reportes WHERE id = $1 OR emprendimiento_id = $2`,
            [reporteId || null, emprendimientoId || null],
          );
        }
        if (resenaId || emprendimientoId) {
          await manager.query(
            `DELETE FROM resenas WHERE id = $1 OR emprendimiento_id = $2`,
            [resenaId || null, emprendimientoId || null],
          );
        }
        if (pedidoId) {
          await manager.query(`DELETE FROM detalles_pedido WHERE pedido_id = $1`, [pedidoId]);
          await manager.query(`DELETE FROM pedidos WHERE id = $1`, [pedidoId]);
        }
        if (productoId) {
          await manager.query(`DELETE FROM presentaciones_producto WHERE producto_id = $1`, [
            productoId,
          ]);
          await manager.query(`DELETE FROM productos WHERE id = $1`, [productoId]);
        }
        if (ubicacionId || emprendimientoId) {
          await manager.query(
            `DELETE FROM ubicaciones WHERE id = $1 OR emprendimiento_id = $2`,
            [ubicacionId || null, emprendimientoId || null],
          );
        }
        if (emprendimientoId) {
          await manager.query(`DELETE FROM emprendimientos WHERE id = $1`, [emprendimientoId]);
        }
        if (userIds.length > 0) {
          await manager.query(
            `DELETE FROM aceptaciones_documentos WHERE usuario_id = ANY($1::uuid[])`,
            [userIds],
          );
        }
        await manager.query(
          `DELETE FROM codigos_verificacion WHERE destino = ANY($1::varchar[])`,
          [telefonos],
        );
        if (userIds.length > 0) {
          await manager.query(
            `DELETE FROM usuarios WHERE id = ANY($1::uuid[]) OR telefono = ANY($2::varchar[])`,
            [userIds, telefonos],
          );
        } else {
          await manager.query(`DELETE FROM usuarios WHERE telefono = ANY($1::varchar[])`, [
            telefonos,
          ]);
        }
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('1. GET /api/v1/health responde 200 con versión de PostGIS y cabeceras de seguridad/CORS', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:8100')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database?.status).toBe('up');
    expect(typeof res.body.database?.postgisVersion).toBe('string');
    expect(res.body.database.postgisVersion.length).toBeGreaterThan(0);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8100');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('2. Registra 2 usuarios de prueba (vendedor y comprador) aceptando documentos legales activos', async () => {
    const docsRes = await request(app.getHttpServer())
      .get('/api/v1/catalogos/documentos-legales')
      .expect(200);

    expect(Array.isArray(docsRes.body)).toBe(true);
    expect(docsRes.body.length).toBeGreaterThanOrEqual(2);
    documentosLegalesIds = docsRes.body.map((d: { id: string }) => d.id);

    // Registro vendedor
    const otpVendedorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/solicitar-codigo')
      .send({ telefono: telefonoVendedor, proposito: 'registro' })
      .expect(200);

    const codigoVendedor = extraerCodigoOtp(otpVendedorRes.body.enlaceWhatsapp);

    const regVendedorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/registro')
      .send({
        nombres: 'Vendedor',
        apellidos: 'Prueba E2E',
        telefono: telefonoVendedor,
        codigo: codigoVendedor,
        documentos_aceptados_ids: documentosLegalesIds,
      })
      .expect(201);

    vendedorAccessToken = regVendedorRes.body.accessToken;
    vendedorRefreshToken = regVendedorRes.body.refreshToken;
    expect(vendedorAccessToken).toBeTruthy();
    expect(vendedorRefreshToken).toBeTruthy();

    const meVendedorRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .expect(200);

    vendedorId = meVendedorRes.body.id;
    expect(vendedorId).toBeTruthy();

    // Registro comprador
    const otpCompradorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/solicitar-codigo')
      .send({ telefono: telefonoComprador, proposito: 'registro' })
      .expect(200);

    const codigoComprador = extraerCodigoOtp(otpCompradorRes.body.enlaceWhatsapp);

    const regCompradorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/registro')
      .send({
        nombres: 'Comprador',
        apellidos: 'Prueba E2E',
        telefono: telefonoComprador,
        codigo: codigoComprador,
        documentos_aceptados_ids: documentosLegalesIds,
      })
      .expect(201);

    compradorAccessToken = regCompradorRes.body.accessToken;
    expect(compradorAccessToken).toBeTruthy();

    const meCompradorRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${compradorAccessToken}`)
      .expect(200);

    compradorId = meCompradorRes.body.id;
    expect(compradorId).toBeTruthy();
  });

  it('3. Crea emprendimiento 1:1, renueva token, registra ubicación en Portoviejo y consulta mapa PostGIS con distanciaKm', async () => {
    const categoriasRes = await request(app.getHttpServer())
      .get('/api/v1/catalogos/categorias-emprendimiento')
      .expect(200);

    expect(categoriasRes.body.length).toBeGreaterThan(0);
    const categoriaId: string = categoriasRes.body[0].id;

    const crearEmpRes = await request(app.getHttpServer())
      .post('/api/v1/emprendimientos')
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .send({
        categoriaId,
        nombre: `Café E2E Portoviejo ${sufijo}`,
        descripcion: 'Emprendimiento temporal creado por la suite E2E.',
        telefonoWhatsapp: telefonoVendedor,
      })
      .expect(201);

    emprendimientoId = crearEmpRes.body.id;
    emprendimientoSlug = crearEmpRes.body.slug;
    expect(emprendimientoId).toBeTruthy();
    expect(emprendimientoSlug).toBeTruthy();

    // Renovar token para reflejar el nuevo rol emprendedor
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: vendedorRefreshToken })
      .expect(200);

    vendedorAccessToken = refreshRes.body.accessToken;
    vendedorRefreshToken = refreshRes.body.refreshToken;
    expect(vendedorAccessToken).toBeTruthy();

    // Obtener cantón Portoviejo (Manabí) desde catálogo geográfico
    const provinciasRes = await request(app.getHttpServer())
      .get('/api/v1/geografia/provincias')
      .expect(200);

    const manabi = provinciasRes.body.find((p: { nombre: string }) => p.nombre === 'Manabí');
    expect(manabi).toBeDefined();

    const cantonesRes = await request(app.getHttpServer())
      .get(`/api/v1/geografia/provincias/${manabi.id}/cantones`)
      .expect(200);

    const portoviejo = cantonesRes.body.find((c: { nombre: string }) => c.nombre === 'Portoviejo');
    expect(portoviejo).toBeDefined();

    const parroquiasRes = await request(app.getHttpServer())
      .get(`/api/v1/geografia/cantones/${portoviejo.id}/parroquias`)
      .expect(200);

    const parroquiaPortoviejo = parroquiasRes.body[0];

    // Registrar ubicación real en Portoviejo
    const crearUbiRes = await request(app.getHttpServer())
      .post('/api/v1/emprendimientos/mi-emprendimiento/ubicaciones')
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .send({
        cantonId: portoviejo.id,
        parroquiaId: parroquiaPortoviejo?.id,
        nombreSucursal: 'Local E2E Centro',
        direccion: 'Av. Manabí y Calle Ramos Iduarte',
        referencia: 'Frente al Parque Las Vegas',
        latitud: -1.0546,
        longitud: -80.4545,
      })
      .expect(201);

    ubicacionId = crearUbiRes.body.id;
    expect(ubicacionId).toBeTruthy();

    // Consultar mapa con PostGIS ST_DWithin + ST_Distance
    const mapaRes = await request(app.getHttpServer())
      .get('/api/v1/mapa/ubicaciones')
      .query({ lat: -1.055, lng: -80.455, radioKm: 5 })
      .expect(200);

    expect(Array.isArray(mapaRes.body)).toBe(true);
    const marcador = mapaRes.body.find(
      (item: { ubicacionId: string }) => item.ubicacionId === ubicacionId,
    );
    expect(marcador).toBeDefined();
    expect(typeof marcador.distanciaKm).toBe('number');
    expect(marcador.distanciaKm).toBeGreaterThanOrEqual(0);
    expect(marcador.distanciaKm).toBeLessThan(1);
  });

  it('4. Crea producto con 2 presentaciones (una con precio y otra con requiereCotizacion: true)', async () => {
    const categoriasProdRes = await request(app.getHttpServer())
      .get('/api/v1/catalogos/categorias-producto')
      .expect(200);

    expect(categoriasProdRes.body.length).toBeGreaterThan(0);
    const categoriaProductoId: string = categoriasProdRes.body[0].id;

    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/emprendimientos/mi-emprendimiento/productos')
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .send({
        categoriaId: categoriaProductoId,
        nombre: `Café Tostado E2E ${sufijo}`,
        descripcion: 'Producto de prueba para suite E2E.',
      })
      .expect(201);

    productoId = prodRes.body.id;
    expect(productoId).toBeTruthy();

    const pres1Res = await request(app.getHttpServer())
      .post(`/api/v1/emprendimientos/mi-emprendimiento/productos/${productoId}/presentaciones`)
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .send({
        nombre: 'Bolsa 500 g',
        descripcion: 'Molido medio',
        requiereCotizacion: false,
        precio: 8.5,
      })
      .expect(201);

    presentacionConPrecioId = pres1Res.body.id;
    expect(presentacionConPrecioId).toBeTruthy();
    expect(Number(pres1Res.body.precio)).toBe(8.5);

    const pres2Res = await request(app.getHttpServer())
      .post(`/api/v1/emprendimientos/mi-emprendimiento/productos/${productoId}/presentaciones`)
      .set('Authorization', `Bearer ${vendedorAccessToken}`)
      .send({
        nombre: 'Pedido Mayorista (saco)',
        descripcion: 'Precio según volumen',
        requiereCotizacion: true,
      })
      .expect(201);

    presentacionCotizableId = pres2Res.body.id;
    expect(presentacionCotizableId).toBeTruthy();
    expect(pres2Res.body.requiereCotizacion).toBe(true);
  });

  it('5. Genera pedido real verificando codigoPedido PED-XXXXXX, totalReferencial, whatsappUrl y avisoSeguridad', async () => {
    const pedidoRes = await request(app.getHttpServer())
      .post('/api/v1/pedidos')
      .set('Authorization', `Bearer ${compradorAccessToken}`)
      .send({
        items: [
          { presentacionId: presentacionConPrecioId, cantidad: 2 },
          { presentacionId: presentacionCotizableId, cantidad: 1 },
        ],
        notaComprador: 'Retiro en la tarde (prueba E2E).',
      })
      .expect(201);

    expect(Array.isArray(pedidoRes.body)).toBe(true);
    expect(pedidoRes.body).toHaveLength(1);

    const pedido = pedidoRes.body[0];
    pedidoId = pedido.id;
    expect(pedidoId).toBeTruthy();
    expect(pedido.codigoPedido).toMatch(/^PED-\d{6}$/);
    expect(pedido.totalReferencial).toBe(17);
    expect(pedido.tieneItemsPorCotizar).toBe(true);
    expect(pedido.estado).toBe(EstadoPedido.NUEVO);
    expect(typeof pedido.whatsappUrl).toBe('string');
    expect(pedido.whatsappUrl).toMatch(/^https:\/\/wa\.me\//);
    expect(typeof pedido.avisoSeguridad).toBe('string');
    expect(pedido.avisoSeguridad.length).toBeGreaterThan(10);
  });

  it('6. Transiciona estados (nuevo → confirmado → preparando → entregado) y confirma recepción del comprador', async () => {
    const transiciones: EstadoPedido[] = [
      EstadoPedido.CONFIRMADO,
      EstadoPedido.PREPARANDO,
      EstadoPedido.ENTREGADO,
    ];

    for (const estado of transiciones) {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${vendedorAccessToken}`)
        .send({ estado })
        .expect(200);

      expect(res.body.estado).toBe(estado);
    }

    const confirmRes = await request(app.getHttpServer())
      .patch(`/api/v1/pedidos/${pedidoId}/confirmar-recepcion`)
      .set('Authorization', `Bearer ${compradorAccessToken}`)
      .expect(200);

    expect(confirmRes.body.compradorConfirmoRecepcion).toBe(true);
    expect(confirmRes.body.fechaConfirmacionComprador).toBeTruthy();
  });

  it('7. Publica reseña pasando la FK compuesta (pedido_id, usuario_id, emprendimiento_id) real en PostgreSQL', async () => {
    const resenaRes = await request(app.getHttpServer())
      .post('/api/v1/resenas')
      .set('Authorization', `Bearer ${compradorAccessToken}`)
      .send({
        pedidoId,
        valoracion: 5,
        comentario: 'Excelente café, entrega puntual (E2E).',
      })
      .expect(201);

    resenaId = resenaRes.body.id;
    expect(resenaId).toBeTruthy();
    expect(resenaRes.body.pedidoId).toBe(pedidoId);
    expect(resenaRes.body.emprendimientoId).toBe(emprendimientoId);
    expect(resenaRes.body.valoracion).toBe(5);
  });

  it('8. Reporta emprendimiento, suspende como admin (cerrarReporte: true), valida 404 público y consulta estadísticas reales', async () => {
    // Reporte ciudadano del comprador
    const reporteRes = await request(app.getHttpServer())
      .post('/api/v1/reportes')
      .set('Authorization', `Bearer ${compradorAccessToken}`)
      .send({
        emprendimientoId,
        pedidoId,
        motivo: MotivoReporte.INCUMPLIMIENTO_PEDIDO,
        descripcion: 'Reporte de prueba E2E para validar moderación reactiva.',
      })
      .expect(201);

    reporteId = reporteRes.body.id;
    expect(reporteId).toBeTruthy();

    // Login de administrador (credenciales del seed / .env)
    const adminCorreo = (process.env.ADMIN_SEED_CORREO ?? 'admin@mapeo.local').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'AdminDev2026-Seguro';

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        correo: adminCorreo,
        contrasena: adminPassword,
      })
      .expect(200);

    adminAccessToken = adminLoginRes.body.accessToken;
    expect(adminAccessToken).toBeTruthy();

    // Suspensión reactiva cerrando el reporte vinculado
    const moderarRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/emprendimientos/${emprendimientoId}/moderar`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        accion: AccionModeracion.SUSPENSION,
        motivo: 'Suspensión de prueba E2E tras reporte verificado.',
        reporteId,
        cerrarReporte: true,
        resolucionReporte: 'Reporte cerrado automáticamente en prueba E2E.',
      })
      .expect(201);

    moderacionId = moderarRes.body.id;
    expect(moderacionId).toBeTruthy();
    expect(moderarRes.body.estadoEmprendimientoActual).toBe(EstadoEmprendimiento.SUSPENDIDO);
    expect(moderarRes.body.reporteCerrado).toBe(true);

    // La ficha pública del emprendimiento suspendido debe devolver 404
    await request(app.getHttpServer())
      .get(`/api/v1/emprendimientos/${emprendimientoSlug}`)
      .expect(404);

    // Consultas reales de estadísticas contra PostgreSQL 18
    const resumenRes = await request(app.getHttpServer())
      .get('/api/v1/admin/estadisticas/resumen')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(resumenRes.body.emprendimientosPorEstado.suspendido).toBeGreaterThanOrEqual(1);
    expect(resumenRes.body.totalUsuarios).toBeGreaterThanOrEqual(2);
    expect(resumenRes.body.pedidosPorEstado.entregado).toBeGreaterThanOrEqual(1);
    expect(
      resumenRes.body.pedidosPorEstado.entregadosConfirmadosPorComprador,
    ).toBeGreaterThanOrEqual(1);

    const distribucionRes = await request(app.getHttpServer())
      .get('/api/v1/admin/estadisticas/distribucion')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(Array.isArray(distribucionRes.body.emprendimientosPorCategoria)).toBe(true);
    expect(Array.isArray(distribucionRes.body.emprendimientosPorUbicacion)).toBe(true);
    expect(Array.isArray(distribucionRes.body.topEmprendimientosPorPedidosEntregados)).toBe(true);
  });
});
