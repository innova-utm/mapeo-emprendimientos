import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import type { JwtPayload, NombreRol } from '../common/auth/index.js';
import {
  CanalVerificacion,
  EstadoRegistro,
  EstadoUsuario,
  PropositoVerificacion,
} from '../common/enums/index.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { AceptacionDocumento } from '../usuarios/entities/aceptacion-documento.entity.js';
import { CodigoVerificacion } from '../usuarios/entities/codigo-verificacion.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { AdminLoginDto, LoginDto, RegistroDto, TokensDto } from './dto/auth.dto.js';
import { CodigoSolicitadoDto, SolicitarCodigoDto } from './dto/solicitar-codigo.dto.js';

export const MAX_INTENTOS = 5;
export const EXPIRACION_CODIGO_MS = 10 * 60 * 1000;
export const COOLDOWN_SOLICITUD_MS = 60 * 1000;
export const MAX_SOLICITUDES_POR_HORA = 5;
const BCRYPT_ROUNDS = 10;
const MSG_CODIGO_INVALIDO = 'Código inválido o expirado. Solicita uno nuevo.';
// Hash de relleno para igualar tiempos de respuesta cuando el correo no existe.
const HASH_RELLENO = bcrypt.hashSync('relleno-no-valido', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(CodigoVerificacion) private readonly codigoRepo: Repository<CodigoVerificacion>,
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(DocumentoLegal) private readonly documentoRepo: Repository<DocumentoLegal>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly whatsapp: WhatsappService,
  ) {}

  // ---------------------------------------------------------------- RF-AUT-01
  async solicitarCodigo(dto: SolicitarCodigoDto): Promise<CodigoSolicitadoDto> {
    const proposito =
      dto.proposito === 'registro' ? PropositoVerificacion.REGISTRO : PropositoVerificacion.LOGIN;
    const usuario = await this.usuarioRepo.findOne({ where: { telefono: dto.telefono } });

    if (proposito === PropositoVerificacion.REGISTRO && usuario) {
      throw new ConflictException('Este teléfono ya está registrado. Inicia sesión.');
    }

    await this.verificarLimiteSolicitudes(dto.telefono, proposito);

    const codigo = this.generarCodigo();
    const fechaExpiracion = new Date(Date.now() + EXPIRACION_CODIGO_MS);
    const respuesta: CodigoSolicitadoDto = {
      expiraEnSegundos: EXPIRACION_CODIGO_MS / 1000,
      fechaExpiracion,
      enlaceWhatsapp: this.whatsapp.construirEnlaceVerificacion(codigo),
      mensaje: 'Envía el mensaje prellenado por WhatsApp para verificar tu número.',
    };

    // Anti-enumeración: para login de cuentas inexistentes/inactivas respondemos igual sin generar código.
    if (proposito === PropositoVerificacion.LOGIN && (!usuario || usuario.estado !== EstadoUsuario.ACTIVO)) {
      this.logger.warn(`Solicitud de login para teléfono sin cuenta activa: ${dto.telefono}`);
      return respuesta;
    }

    await this.codigoRepo.save(
      this.codigoRepo.create({
        usuarioId: usuario?.id ?? null,
        destino: dto.telefono,
        canal: CanalVerificacion.WHATSAPP,
        proposito,
        codigoHash: await bcrypt.hash(codigo, BCRYPT_ROUNDS),
        intentos: 0,
        fechaExpiracion,
        fechaUtilizacion: null,
      }),
    );
    await this.whatsapp.enviarCodigo(dto.telefono, codigo, proposito);
    return respuesta;
  }

  // ------------------------------------------------------------ RF-AUT-02/03
  async registro(dto: RegistroDto): Promise<TokensDto> {
    if (await this.usuarioRepo.exists({ where: { telefono: dto.telefono } })) {
      throw new ConflictException('Este teléfono ya está registrado. Inicia sesión.');
    }
    if (dto.correo && (await this.usuarioRepo.exists({ where: { correo: dto.correo } }))) {
      throw new ConflictException('El correo ya está registrado por otro usuario');
    }

    const codigo = await this.validarCodigo(dto.telefono, PropositoVerificacion.REGISTRO, dto.codigo);
    const documentos = await this.validarDocumentosAceptados(dto.documentos_aceptados_ids);

    const rol = await this.rolRepo.findOne({ where: { nombre: 'consumidor' } });
    if (!rol) {
      throw new InternalServerErrorException('Rol consumidor no configurado (ejecuta el seed)');
    }

    let usuario: Usuario;
    try {
      usuario = await this.dataSource.transaction(async (manager) => {
        const creado = await manager.save(
          manager.create(Usuario, {
            rolId: rol.id,
            nombres: dto.nombres,
            apellidos: dto.apellidos,
            telefono: dto.telefono,
            telefonoVerificado: true,
            correo: dto.correo ?? null,
            estado: EstadoUsuario.ACTIVO,
          }),
        );
        await manager.save(
          documentos.map((documento) =>
            manager.create(AceptacionDocumento, { usuarioId: creado.id, documentoId: documento.id }),
          ),
        );
        await this.consumirCodigo(manager, codigo.id, creado.id);
        return creado;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('El teléfono o correo ya está registrado');
      }
      throw error;
    }

    return this.emitirTokens(usuario.id, 'consumidor');
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    const codigo = await this.validarCodigo(dto.telefono, PropositoVerificacion.LOGIN, dto.codigo);
    const usuario = await this.usuarioRepo.findOne({
      where: { telefono: dto.telefono },
      relations: { rol: true },
    });
    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new ForbiddenException('La cuenta no está activa');
    }
    await this.consumirCodigo(this.dataSource.manager, codigo.id, usuario.id);
    return this.emitirTokens(usuario.id, usuario.rol.nombre as NombreRol);
  }

  // ---------------------------------------------------------------- RF-AUT-04
  async adminLogin(dto: AdminLoginDto): Promise<TokensDto> {
    const usuario = await this.usuarioRepo.findOne({
      where: { correo: dto.correo },
      relations: { rol: true },
    });
    const hash = usuario?.contrasena ?? HASH_RELLENO;
    const coincide = await bcrypt.compare(dto.contrasena, hash);

    if (
      !usuario ||
      !coincide ||
      usuario.rol.nombre !== 'administrador' ||
      usuario.estado !== EstadoUsuario.ACTIVO
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.emitirTokens(usuario.id, 'administrador');
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('app.jwtRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub },
      relations: { rol: true },
    });
    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    return this.emitirTokens(usuario.id, usuario.rol.nombre as NombreRol);
  }

  // ------------------------------------------------------------------ Webhook
  /** Procesa mensajes entrantes (verificación inversa) y marca códigos como verificados. */
  async procesarWebhook(payload: unknown): Promise<number> {
    let verificados = 0;
    for (const mensaje of this.whatsapp.extraerMensajesEntrantes(payload)) {
      const coincidencia = /\b(\d{6})\b/.exec(mensaje.texto);
      if (!coincidencia) continue;

      const pendientes = await this.codigoRepo.find({
        where: {
          destino: mensaje.telefono,
          canal: CanalVerificacion.WHATSAPP,
          fechaUtilizacion: IsNull(),
          fechaExpiracion: MoreThan(new Date()),
          intentos: LessThan(MAX_INTENTOS),
        },
        order: { fechaCreacion: 'DESC' },
        take: 3,
      });
      for (const pendiente of pendientes) {
        if (await bcrypt.compare(coincidencia[1], pendiente.codigoHash)) {
          this.whatsapp.marcarVerificado(pendiente.id, pendiente.fechaExpiracion);
          verificados++;
          break;
        }
      }
    }
    return verificados;
  }

  // ---------------------------------------------------------------- Helpers
  generarCodigo(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /** Valida el último código pendiente; incrementa `intentos` en cada fallo (máx. 5). */
  async validarCodigo(
    telefono: string,
    proposito: PropositoVerificacion,
    codigo: string,
  ): Promise<CodigoVerificacion> {
    const registro = await this.codigoRepo.findOne({
      where: {
        destino: telefono,
        canal: CanalVerificacion.WHATSAPP,
        proposito,
        fechaUtilizacion: IsNull(),
      },
      order: { fechaCreacion: 'DESC' },
    });
    if (!registro) {
      throw new UnauthorizedException(MSG_CODIGO_INVALIDO);
    }
    if (registro.fechaExpiracion.getTime() <= Date.now()) {
      throw new UnauthorizedException(MSG_CODIGO_INVALIDO);
    }
    if (registro.intentos >= MAX_INTENTOS) {
      throw new HttpException(
        'Código bloqueado por demasiados intentos fallidos. Solicita uno nuevo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!(await bcrypt.compare(codigo, registro.codigoHash))) {
      await this.codigoRepo.increment({ id: registro.id }, 'intentos', 1);
      throw new UnauthorizedException('Código incorrecto');
    }
    if (!this.whatsapp.estaVerificado(registro.id)) {
      throw new UnauthorizedException(
        'Aún no recibimos tu mensaje de WhatsApp. Envíalo desde el enlace y vuelve a intentar.',
      );
    }
    return registro;
  }

  private async verificarLimiteSolicitudes(
    telefono: string,
    proposito: PropositoVerificacion,
  ): Promise<void> {
    const recientes = await this.codigoRepo.find({
      where: {
        destino: telefono,
        canal: CanalVerificacion.WHATSAPP,
        proposito,
        fechaCreacion: MoreThan(new Date(Date.now() - 60 * 60 * 1000)),
      },
      order: { fechaCreacion: 'DESC' },
    });
    if (recientes.length >= MAX_SOLICITUDES_POR_HORA) {
      throw new HttpException(
        'Demasiadas solicitudes de código. Intenta de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const ultima = recientes[0];
    if (ultima && Date.now() - ultima.fechaCreacion.getTime() < COOLDOWN_SOLICITUD_MS) {
      throw new HttpException(
        'Espera un minuto antes de solicitar un nuevo código.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Exige aceptar TODOS los documentos legales activos (incluye terminos y privacidad). */
  private async validarDocumentosAceptados(ids: string[]): Promise<DocumentoLegal[]> {
    const activos = await this.documentoRepo.find({ where: { estado: EstadoRegistro.ACTIVO } });
    for (const tipo of ['terminos', 'privacidad']) {
      if (!activos.some((documento) => documento.tipo === tipo)) {
        throw new InternalServerErrorException(`Documento legal '${tipo}' no configurado`);
      }
    }
    const idsActivos = new Set(activos.map((documento) => documento.id));
    if (ids.some((id) => !idsActivos.has(id))) {
      throw new BadRequestException('Se enviaron documentos legales inexistentes o no vigentes');
    }
    const faltantes = activos.filter((documento) => !ids.includes(documento.id));
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Debes aceptar todos los documentos legales vigentes: ${faltantes
          .map((documento) => `${documento.tipo} (${documento.id})`)
          .join(', ')}`,
      );
    }
    return activos;
  }

  /** Marca el código como utilizado de forma atómica (evita doble uso concurrente). */
  private async consumirCodigo(
    manager: DataSource['manager'],
    codigoId: string,
    usuarioId: string,
  ): Promise<void> {
    const resultado = await manager.update(
      CodigoVerificacion,
      { id: codigoId, fechaUtilizacion: IsNull() },
      { fechaUtilizacion: new Date(), usuarioId },
    );
    if (resultado.affected !== 1) {
      throw new UnauthorizedException(MSG_CODIGO_INVALIDO);
    }
  }

  private async emitirTokens(usuarioId: string, rol: NombreRol): Promise<TokensDto> {
    const accessTtl = this.configService.getOrThrow<number>('app.jwtAccessTtl');
    const refreshTtl = this.configService.getOrThrow<number>('app.jwtRefreshTtl');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: usuarioId, rol, type: 'access' } satisfies JwtPayload,
        { secret: this.configService.getOrThrow<string>('app.jwtSecret'), expiresIn: accessTtl },
      ),
      this.jwtService.signAsync(
        { sub: usuarioId, rol, type: 'refresh' } satisfies JwtPayload,
        { secret: this.configService.getOrThrow<string>('app.jwtRefreshSecret'), expiresIn: refreshTtl },
      ),
    ]);
    return { accessToken, refreshToken, tipo: 'Bearer', expiraEnSegundos: accessTtl };
  }
}
