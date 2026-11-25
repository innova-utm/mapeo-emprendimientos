import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, Public, type UsuarioAutenticado } from '../common/auth/index.js';
import { UsuarioPerfilDto } from '../usuarios/dto/usuario-perfil.dto.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { AuthService } from './auth.service.js';
import { AdminLoginDto, LoginDto, RefreshDto, RegistroDto, TokensDto } from './dto/auth.dto.js';
import { CodigoSolicitadoDto, SolicitarCodigoDto } from './dto/solicitar-codigo.dto.js';

const LIMITE_ESTRICTO = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Public()
  @Throttle(LIMITE_ESTRICTO)
  @Post('solicitar-codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar código OTP por WhatsApp (RF-AUT-01)',
    description:
      'Genera un código de 6 dígitos (válido 10 min, guardado solo como hash). En modo mock el código y el enlace wa.me se imprimen en la consola del servidor.',
  })
  @ApiOkResponse({ type: CodigoSolicitadoDto })
  @ApiConflictResponse({ description: 'Teléfono ya registrado (propósito registro)' })
  @ApiTooManyRequestsResponse({ description: 'Límite de solicitudes excedido' })
  solicitarCodigo(@Body() dto: SolicitarCodigoDto): Promise<CodigoSolicitadoDto> {
    return this.authService.solicitarCodigo(dto);
  }

  @Public()
  @Throttle(LIMITE_ESTRICTO)
  @Post('registro')
  @ApiOperation({
    summary: 'Registro de consumidor (RF-AUT-02/03)',
    description:
      'Valida el código, exige aceptar todos los documentos legales activos y crea el usuario con rol consumidor.',
  })
  @ApiCreatedResponse({ type: TokensDto })
  @ApiUnauthorizedResponse({ description: 'Código incorrecto, expirado o ya usado' })
  @ApiTooManyRequestsResponse({ description: 'Código bloqueado tras 5 intentos' })
  registro(@Body() dto: RegistroDto): Promise<TokensDto> {
    return this.authService.registro(dto);
  }

  @Public()
  @Throttle(LIMITE_ESTRICTO)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con teléfono + código OTP' })
  @ApiOkResponse({ type: TokensDto })
  @ApiUnauthorizedResponse({ description: 'Código incorrecto o expirado' })
  login(@Body() dto: LoginDto): Promise<TokensDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle(LIMITE_ESTRICTO)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administrador (correo + contraseña)' })
  @ApiOkResponse({ type: TokensDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  adminLogin(@Body() dto: AdminLoginDto): Promise<TokensDto> {
    return this.authService.adminLogin(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar accessToken con un refreshToken válido' })
  @ApiOkResponse({ type: TokensDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
  refresh(@Body() dto: RefreshDto): Promise<TokensDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado con su rol' })
  @ApiOkResponse({ type: UsuarioPerfilDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  me(@CurrentUser() usuario: UsuarioAutenticado): Promise<UsuarioPerfilDto> {
    return this.usuariosService.obtenerPerfil(usuario.id);
  }

  @Public()
  @SkipThrottle()
  @Get('whatsapp/webhook')
  @ApiOperation({ summary: 'Challenge de verificación del webhook de Meta' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  verificarWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    return this.whatsapp.verificarChallenge(mode, token, challenge);
  }

  @Public()
  @SkipThrottle()
  @Post('whatsapp/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de mensajes entrantes de WhatsApp (verificación inversa)',
    description:
      'Recibe mensajes entrantes de Meta, valida la firma X-Hub-Signature-256 y marca el código como verificado.',
  })
  async recibirWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: Record<string, unknown>,
    @Headers('x-hub-signature-256') firma?: string,
  ): Promise<{ status: string; verificados: number }> {
    if (!this.whatsapp.verificarFirma(req.rawBody, firma)) {
      throw new ForbiddenException('Firma de webhook inválida');
    }
    const verificados = await this.authService.procesarWebhook(payload);
    return { status: 'ok', verificados };
  }
}
