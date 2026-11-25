import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Expone JwtService globalmente para los guards. Los secretos y TTL se pasan
 * explícitamente en cada firma/verificación (access y refresh usan secretos distintos).
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  exports: [JwtModule],
})
export class AuthCommonModule {}
