import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  EstadoEmprendimiento,
  EstadoPedido,
  EstadoRegistro,
} from '../common/enums/index.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { PresentacionProducto } from '../productos/entities/presentacion-producto.entity.js';
import type {
  CrearPedidoDto,
  ListarPedidosQueryDto,
} from './dto/pedido.dto.js';
import type {
  DetallePedidoResponseDto,
  PaginatedPedidosDto,
  PedidoCreadoResponseDto,
  PedidoResponseDto,
} from './dto/pedido-response.dto.js';
import { DetallePedido } from './entities/detalle-pedido.entity.js';
import { Pedido } from './entities/pedido.entity.js';
import {
  AVISO_SEGURIDAD,
  construirMensajeWhatsapp,
  construirWhatsappUrl,
  transicionPermitida,
} from './pedidos.utils.js';

const aCentavos = (valor: string | number): number => Math.round(Number(valor) * 100);

function mapDetalle(d: DetallePedido): DetallePedidoResponseDto {
  return {
    id: d.id,
    nombreProducto: d.nombreProducto,
    nombrePresentacion: d.nombrePresentacion,
    requiereCotizacion: d.requiereCotizacion,
    precioUnitario: d.precioUnitario === null ? null : Number(d.precioUnitario),
    cantidad: d.cantidad,
  };
}

export function mapPedido(p: Pedido, incluirComprador = false): PedidoResponseDto {
  const detalles = p.detalles ?? [];
  return {
    id: p.id,
    codigoPedido: p.codigoPedido,
    emprendimientoId: p.emprendimientoId,
    nombreEmprendimiento: p.nombreEmprendimientoSnapshot,
    estado: p.estado,
    notaComprador: p.notaComprador,
    totalReferencial: p.totalReferencial === null ? null : Number(p.totalReferencial),
    tieneItemsPorCotizar: detalles.some((d) => d.requiereCotizacion),
    compradorConfirmoRecepcion: p.compradorConfirmoRecepcion,
    fechaConfirmacionComprador: p.fechaConfirmacionComprador,
    detalles: detalles.map(mapDetalle),
    comprador:
      incluirComprador && p.usuario
        ? {
            id: p.usuario.id,
            nombre: `${p.usuario.nombres} ${p.usuario.apellidos}`.trim(),
            telefono: p.usuario.telefono,
          }
        : undefined,
    fechaCreacion: p.fechaCreacion,
    fechaActualizacion: p.fechaActualizacion,
  };
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido) private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Emprendimiento)
    private readonly emprendimientoRepo: Repository<Emprendimiento>,
    private readonly dataSource: DataSource,
  ) {}

  /** RF-PED-03/04, RN-08/09/10, RNF-06: un pedido por emprendimiento dentro de una transacción ACID. */
  async crear(usuarioId: string, dto: CrearPedidoDto): Promise<PedidoCreadoResponseDto[]> {
    // Consolida presentaciones repetidas.
    const cantidades = new Map<string, number>();
    for (const item of dto.items) {
      cantidades.set(item.presentacionId, (cantidades.get(item.presentacionId) ?? 0) + item.cantidad);
    }
    const ids = [...cantidades.keys()];
    const notas = new Map((dto.notasPorEmprendimiento ?? []).map((n) => [n.emprendimientoId, n.nota]));

    return this.dataSource.transaction(async (manager) => {
      // Los precios y estados siempre se leen de BD (nunca del cliente).
      const presentaciones = await manager.find(PresentacionProducto, {
        where: { id: In(ids) },
        relations: { producto: { emprendimiento: true } },
      });

      if (presentaciones.length !== ids.length) {
        throw new BadRequestException('Alguna presentación del carrito no existe');
      }

      for (const pr of presentaciones) {
        if (
          pr.estado !== EstadoRegistro.ACTIVO ||
          pr.producto?.estado !== EstadoRegistro.ACTIVO ||
          pr.producto?.emprendimiento?.estado !== EstadoEmprendimiento.ACTIVO
        ) {
          throw new BadRequestException(
            `La presentación "${pr.nombre}" ya no está disponible (inactiva, producto inactivo o emprendimiento no activo)`,
          );
        }
      }

      // Agrupa por emprendimiento preservando el orden del carrito.
      const grupos = new Map<string, PresentacionProducto[]>();
      for (const id of ids) {
        const pr = presentaciones.find((x) => x.id === id) as PresentacionProducto;
        const empId = pr.producto.emprendimientoId;
        grupos.set(empId, [...(grupos.get(empId) ?? []), pr]);
      }

      const resultado: PedidoCreadoResponseDto[] = [];

      for (const [empId, items] of grupos) {
        const emp = items[0].producto.emprendimiento;
        const itemsConPrecio = items.filter((i) => !i.requiereCotizacion && i.precio !== null);
        const totalCentavos = itemsConPrecio.length
          ? itemsConPrecio.reduce(
              (acc, i) => acc + aCentavos(i.precio as string) * (cantidades.get(i.id) as number),
              0,
            )
          : null;
        const nota = notas.get(empId) ?? dto.notaComprador ?? null;

        const creado = await manager.save(
          Pedido,
          manager.create(Pedido, {
            usuarioId,
            emprendimientoId: empId,
            nombreEmprendimientoSnapshot: emp.nombre,
            whatsappEmprendimientoSnapshot: emp.telefonoWhatsapp,
            notaComprador: nota,
            totalReferencial: totalCentavos === null ? null : (totalCentavos / 100).toFixed(2),
            estado: EstadoPedido.NUEVO,
          }),
        );

        const detalles = await manager.save(
          DetallePedido,
          items.map((i) =>
            manager.create(DetallePedido, {
              pedidoId: creado.id,
              presentacionId: i.id,
              nombreProducto: i.producto.nombre,
              nombrePresentacion: i.nombre,
              requiereCotizacion: i.requiereCotizacion,
              precioUnitario: i.requiereCotizacion && i.precio === null ? null : i.precio,
              cantidad: cantidades.get(i.id) as number,
            }),
          ),
        );

        // codigo_pedido lo autogenera PostgreSQL (seq_codigo_pedido): se relee tras insertar.
        const persistido = await manager.findOne(Pedido, { where: { id: creado.id } });
        const codigoPedido = persistido?.codigoPedido ?? creado.codigoPedido;
        const tieneItemsPorCotizar = items.some((i) => i.requiereCotizacion);

        const mensaje = construirMensajeWhatsapp({
          codigoPedido,
          nombreEmprendimiento: emp.nombre,
          items: items.map((i) => ({
            cantidad: cantidades.get(i.id) as number,
            nombreProducto: i.producto.nombre,
            nombrePresentacion: i.nombre,
            requiereCotizacion: i.requiereCotizacion,
            precioUnitarioCentavos: i.precio === null ? null : aCentavos(i.precio),
          })),
          totalReferencialCentavos: totalCentavos,
          tieneItemsPorCotizar,
          nota,
        });

        resultado.push(
          Object.assign(
            mapPedido(Object.assign(new Pedido(), creado, persistido, { codigoPedido, detalles })),
            {
              tieneItemsPorCotizar,
              whatsappUrl: construirWhatsappUrl(emp.telefonoWhatsapp, mensaje),
              avisoSeguridad: AVISO_SEGURIDAD,
            },
          ),
        );
      }

      return resultado;
    });
  }

  /** RF-PED-05 */
  async listarMisPedidos(usuarioId: string, query: ListarPedidosQueryDto): Promise<PaginatedPedidosDto> {
    return this.paginar({ usuarioId, ...(query.estado ? { estado: query.estado } : {}) }, query, false);
  }

  /** RF-PED-06 */
  async listarRecibidos(usuarioId: string, query: ListarPedidosQueryDto): Promise<PaginatedPedidosDto> {
    const emp = await this.obtenerEmprendimientoDelUsuario(usuarioId);
    return this.paginar(
      { emprendimientoId: emp.id, ...(query.estado ? { estado: query.estado } : {}) },
      query,
      true,
    );
  }

  async obtenerDetalle(usuarioId: string, pedidoId: string): Promise<PedidoResponseDto> {
    const pedido = await this.cargarPedido(pedidoId);
    const esComprador = pedido.usuarioId === usuarioId;
    const esTitular = pedido.emprendimiento?.usuarioId === usuarioId;
    if (!esComprador && !esTitular) {
      throw new ForbiddenException('No tienes acceso a este pedido');
    }
    return mapPedido(pedido, esTitular);
  }

  /** RF-PED-07, RN-11 */
  async actualizarEstado(
    usuarioId: string,
    pedidoId: string,
    nuevoEstado: EstadoPedido,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.cargarPedido(pedidoId);
    if (pedido.emprendimiento?.usuarioId !== usuarioId) {
      throw new ForbiddenException('Solo el titular del emprendimiento receptor puede cambiar el estado');
    }
    if (!transicionPermitida(pedido.estado, nuevoEstado)) {
      throw new BadRequestException(
        `Transición no permitida: ${pedido.estado} → ${nuevoEstado}`,
      );
    }
    await this.pedidoRepo.update({ id: pedido.id }, { estado: nuevoEstado });
    return mapPedido(await this.cargarPedido(pedidoId), true);
  }

  /** RF-PED-08, RN-12 */
  async confirmarRecepcion(usuarioId: string, pedidoId: string): Promise<PedidoResponseDto> {
    const pedido = await this.cargarPedido(pedidoId);
    if (pedido.usuarioId !== usuarioId) {
      throw new ForbiddenException('Solo el comprador puede confirmar la recepción');
    }
    if (pedido.estado === EstadoPedido.CANCELADO) {
      throw new BadRequestException('No se puede confirmar la recepción de un pedido cancelado');
    }
    if (!pedido.compradorConfirmoRecepcion) {
      await this.pedidoRepo.update(
        { id: pedido.id },
        { compradorConfirmoRecepcion: true, fechaConfirmacionComprador: new Date() },
      );
    }
    return mapPedido(await this.cargarPedido(pedidoId));
  }

  // ---------------------------------------------------------------------------

  private async paginar(
    where: Record<string, unknown>,
    query: ListarPedidosQueryDto,
    incluirComprador: boolean,
  ): Promise<PaginatedPedidosDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [pedidos, total] = await this.pedidoRepo.findAndCount({
      where,
      relations: { detalles: true, ...(incluirComprador ? { usuario: true } : {}) },
      order: { fechaCreacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: pedidos.map((p) => mapPedido(p, incluirComprador)),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }

  private async cargarPedido(pedidoId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: pedidoId },
      relations: { detalles: true, emprendimiento: true, usuario: true },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return pedido;
  }

  private async obtenerEmprendimientoDelUsuario(usuarioId: string): Promise<Emprendimiento> {
    const emp = await this.emprendimientoRepo.findOne({ where: { usuarioId } });
    if (!emp) {
      throw new NotFoundException('No tienes un emprendimiento registrado');
    }
    return emp;
  }
}
