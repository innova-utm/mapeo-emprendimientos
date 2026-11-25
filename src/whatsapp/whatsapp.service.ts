import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

export type WhatsappMode = 'mock' | 'meta';

export interface MensajeEntrante {
  /** Teléfono del remitente en formato E.164 (con prefijo +). */
  telefono: string;
  texto: string;
}

/**
 * Servicio desacoplado de WhatsApp controlado por WHATSAPP_MODE.
 *
 * - `mock`: imprime el código y el enlace wa.me en consola; no requiere cuenta de Meta
 *   ni confirmación por webhook.
 * - `meta`: verificación inversa. El usuario envía el código al número oficial y el
 *   webhook de Meta lo confirma (la confirmación se guarda en memoria hasta que expire
 *   el código; para múltiples instancias reemplazar por almacenamiento compartido).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly verificados = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {}

  get modo(): WhatsappMode {
    return this.configService.get<string>('app.whatsappMode', 'mock') === 'meta' ? 'meta' : 'mock';
  }

  construirEnlaceVerificacion(codigo: string): string {
    const numero = this.configService
      .get<string>('app.whatsappBusinessNumber', '593999999999')
      .replace(/\D/g, '');
    const texto = encodeURIComponent(`Mi código de verificación es ${codigo}`);
    return `https://wa.me/${numero}?text=${texto}`;
  }

  /** En `mock` imprime el código en consola; en `meta` el flujo es inverso y no se envía nada. */
  async enviarCodigo(telefono: string, codigo: string, proposito: string): Promise<void> {
    if (this.modo === 'mock') {
      this.logger.log(
        `[MOCK WhatsApp] Código ${proposito} para ${telefono}: ${codigo}\n` +
          `[MOCK WhatsApp] Enlace de verificación inversa: ${this.construirEnlaceVerificacion(codigo)}`,
      );
      return;
    }
    this.logger.debug(`Verificación inversa pendiente para ${telefono} (${proposito})`);
  }

  /** GET challenge de Meta: devuelve hub.challenge si el token coincide. */
  verificarChallenge(mode?: string, token?: string, challenge?: string): string {
    const esperado = this.configService.get<string>('app.whatsappVerifyToken', '');
    if (mode !== 'subscribe' || !esperado || token !== esperado || !challenge) {
      throw new ForbiddenException('Verificación de webhook rechazada');
    }
    return challenge;
  }

  /** Valida X-Hub-Signature-256. En `mock` sin secreto se acepta; en `meta` falla cerrado. */
  verificarFirma(rawBody: Buffer | undefined, firma?: string): boolean {
    const secreto = this.configService.get<string>('app.whatsappAppSecret', '');
    if (!secreto) {
      return this.modo === 'mock';
    }
    if (!rawBody || !firma) {
      return false;
    }
    const esperada = `sha256=${createHmac('sha256', secreto).update(rawBody).digest('hex')}`;
    const a = Buffer.from(esperada);
    const b = Buffer.from(firma);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Extrae los mensajes de texto entrantes del payload de la Cloud API de Meta. */
  extraerMensajesEntrantes(payload: unknown): MensajeEntrante[] {
    const mensajes: MensajeEntrante[] = [];
    const entradas = (payload as any)?.entry;
    if (!Array.isArray(entradas)) {
      return mensajes;
    }
    for (const entrada of entradas) {
      for (const cambio of entrada?.changes ?? []) {
        for (const msg of cambio?.value?.messages ?? []) {
          if (
            msg?.type === 'text' &&
            typeof msg.from === 'string' &&
            typeof msg.text?.body === 'string'
          ) {
            mensajes.push({ telefono: `+${msg.from}`, texto: msg.text.body });
          }
        }
      }
    }
    return mensajes;
  }

  marcarVerificado(codigoId: string, expiraEn: Date): void {
    const ahora = Date.now();
    for (const [id, exp] of this.verificados) {
      if (exp <= ahora) {
        this.verificados.delete(id);
      }
    }
    this.verificados.set(codigoId, expiraEn.getTime());
  }

  /** En `mock` no se exige confirmación por webhook. */
  estaVerificado(codigoId: string): boolean {
    if (this.modo === 'mock') {
      return true;
    }
    const exp = this.verificados.get(codigoId);
    return exp !== undefined && exp > Date.now();
  }
}
