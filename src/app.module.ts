import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CatalogosModule } from './catalogos/catalogos.module.js';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { ALL_ENTITIES } from './database/entities.js';
import { GeografiaModule } from './geografia/geografia.module.js';
import { HealthModule } from './health/health.module.js';

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
    HealthModule,
    CatalogosModule,
    GeografiaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
