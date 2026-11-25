import { EstadoPedido } from '../common/enums/index.js';

export const AVISO_SEGURIDAD =
  'Aviso de seguridad: esta plataforma no procesa pagos ni garantiza transacciones externas. ' +
  'No envíes dinero por adelantado a desconocidos, verifica al vendedor y acuerda la entrega de forma segura. ' +
  'Abrir WhatsApp no confirma el pedido.';

/** Máquina de estados estricta (RN-11). `entregado` y `cancelado` son terminales. */
export const TRANSICIONES_PEDIDO: Record<EstadoPedido, EstadoPedido[]> = {
  [EstadoPedido.NUEVO]: [EstadoPedido.CONFIRMADO, EstadoPedido.CANCELADO],
  [EstadoPedido.CONFIRMADO]: [EstadoPedido.PREPARANDO, EstadoPedido.CANCELADO],
  [EstadoPedido.PREPARANDO]: [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO],
  [EstadoPedido.ENTREGADO]: [],
  [EstadoPedido.CANCELADO]: [],
};

export function transicionPermitida(actual: EstadoPedido, nuevo: EstadoPedido): boolean {
  return TRANSICIONES_PEDIDO[actual].includes(nuevo);
}

export interface ItemMensaje {
  cantidad: number;
  nombreProducto: string;
  nombrePresentacion: string;
  requiereCotizacion: boolean;
  /** Precio unitario en centavos o null si es por cotizar. */
  precioUnitarioCentavos: number | null;
}

const fmt = (centavos: number): string => `$${(centavos / 100).toFixed(2)}`;

export function construirMensajeWhatsapp(params: {
  codigoPedido: string;
  nombreEmprendimiento: string;
  items: ItemMensaje[];
  totalReferencialCentavos: number | null;
  tieneItemsPorCotizar: boolean;
  nota: string | null;
}): string {
  const lineas = [
    `Hola ${params.nombreEmprendimiento}, quiero confirmar mi pedido ${params.codigoPedido}:`,
    '',
    ...params.items.map((i) => {
      const base = `- ${i.cantidad} x ${i.nombreProducto} (${i.nombrePresentacion})`;
      if (i.requiereCotizacion || i.precioUnitarioCentavos === null) {
        return `${base}: por cotizar`;
      }
      return `${base}: ${fmt(i.precioUnitarioCentavos)} c/u = ${fmt(i.precioUnitarioCentavos * i.cantidad)}`;
    }),
    '',
  ];
  if (params.totalReferencialCentavos !== null) {
    lineas.push(
      `Total referencial: ${fmt(params.totalReferencialCentavos)}${params.tieneItemsPorCotizar ? ' (sin ítems por cotizar)' : ''}`,
    );
  } else {
    lineas.push('Total referencial: por cotizar');
  }
  if (params.nota) lineas.push(`Nota: ${params.nota}`);
  return lineas.join('\n');
}

/** `https://wa.me/<numero_sin_mas>?text=<mensaje_codificado>` */
export function construirWhatsappUrl(telefonoE164: string, mensaje: string): string {
  const numero = telefonoE164.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
