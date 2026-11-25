import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AuthCommonModule, JwtAuthGuard, RolesGuard } from './common/auth/index.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CatalogosModule } from './catalogos/catalogos.module.js';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { ALL_ENTITIES } from './database/entities.js';
import { EmprendimientosModule } from './emprendimientos/emprendimientos.module.js';
import { GeografiaModule } from './geografia/geografia.module.js';
import { HealthModule } from './health/health.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { ProductosModule } from './productos/productos.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UbicacionesModule } from './ubicaciones/ubicaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.get<string>('database.username', 'postgres'),
        password: configService.get<string>('database.password', ''),
        database: configService.get<string>('database.database', 'mapeo_emprendimientos'),
        entities: ALL_ENTITIES,
        autoLoadEntities: true,
        // REGLA CRÍTICA: la base de datos ya existe con el script físico SQL.
        synchronize: false,
        migrationsRun: false,
        logging:
          configService.get<string>('app.nodeEnv', 'development') === 'development'
            ? ['error', 'warn']
            : ['error'],
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthCommonModule,
    StorageModule,
    WhatsappModule,
    AuthModule,
    UsuariosModule,
    EmprendimientosModule,
    UbicacionesModule,
    HealthModule,
    CatalogosModule,
    GeografiaModule,
    ProductosModule,
    PedidosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Orden de ejecución: rate limiting -> autenticación JWT -> roles (RNF-03/RNF-04).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
