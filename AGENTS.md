# Reglas del Proyecto - Backend Plataforma de Emprendimientos (Ecuador)

- Stack: NestJS + TypeScript (ESM) + TypeORM + PostgreSQL 18 / PostGIS + Vitest + Swagger.
- Documentación oficial en: `documentation/` (especificación técnica y modelo físico SQL).
- REGLA CRÍTICA DE BD: `synchronize: false` SIEMPRE. La base de datos ya existe y su fuente de verdad es el modelo físico SQL (24 tablas, 9 ENUMs, índices GIST, índices parciales únicos, FKs compuestas, secuencia `seq_codigo_pedido` y triggers de `fecha_actualizacion`).
- Convenciones:
  - Validar todos los DTOs con `class-validator` y `class-transformer`.
  - Documentar cada controlador y DTO con `@nestjs/swagger`.
  - Fechas siempre en `TIMESTAMPTZ` (UTC).
  - Borrado lógico mediante columnas `estado` en entidades principales; nunca `DELETE` físico en usuarios, emprendimientos, productos o pedidos.
  - Desacoplar servicios externos (WhatsApp y Storage) con modo `mock` para desarrollo local.
