-- =========================================================================
-- MODELO FÍSICO DE BASE DE DATOS - POSTGRESQL 14+ & POSTGIS
-- =========================================================================

-- la bace de datos esta en el sevidor local de mi computadora, 
-- el servidir es el localhost 
-- el usuario es el por defecto de postgres 
-- la contraseña es 2003

CREATE EXTENSION IF NOT EXISTS postgis;

-- -------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- -------------------------------------------------------------------------

CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE canal_verificacion AS ENUM ('whatsapp', 'correo');
CREATE TYPE proposito_verificacion AS ENUM ('registro', 'login', 'cambio_telefono', 'recuperacion');
CREATE TYPE estado_registro AS ENUM ('activo', 'inactivo');
CREATE TYPE estado_emprendimiento AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE estado_pedido AS ENUM ('nuevo', 'confirmado', 'preparando', 'entregado', 'cancelado');
CREATE TYPE motivo_reporte AS ENUM (
    'posible_estafa',
    'producto_enganoso',
    'incumplimiento_pedido',
    'ubicacion_falsa',
    'contenido_inapropiado',
    'otro'
);
CREATE TYPE estado_reporte AS ENUM ('pendiente', 'en_revision', 'resuelto', 'descartado');
CREATE TYPE accion_moderacion AS ENUM ('advertencia', 'suspension', 'reactivacion');

-- -------------------------------------------------------------------------
-- 2. FUNCIONES Y SECUENCIAS AUXILIARES
-- -------------------------------------------------------------------------

CREATE SEQUENCE seq_codigo_pedido START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION fn_actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 3. MÓDULO DE USUARIOS, ACCESO Y LEGAL
-- -------------------------------------------------------------------------

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    telefono_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    correo VARCHAR(255) UNIQUE,
    correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    contrasena VARCHAR(255),
    estado estado_usuario NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ
);

CREATE INDEX idx_usuarios_rol ON usuarios (rol_id);
CREATE INDEX idx_usuarios_estado ON usuarios (estado);

CREATE TABLE codigos_verificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    destino VARCHAR(255) NOT NULL,
    canal canal_verificacion NOT NULL,
    proposito proposito_verificacion NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos >= 0),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_utilizacion TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_codigos_expiracion CHECK (fecha_expiracion > fecha_creacion)
);

CREATE INDEX idx_codigos_usuario ON codigos_verificacion (usuario_id);
CREATE INDEX idx_codigos_destino_canal ON codigos_verificacion (destino, canal, proposito);

CREATE TABLE documentos_legales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    version VARCHAR(30) NOT NULL,
    contenido_url TEXT NOT NULL,
    estado estado_registro NOT NULL DEFAULT 'activo',
    fecha_publicacion TIMESTAMPTZ,
    CONSTRAINT uq_documentos_tipo_version UNIQUE (tipo, version)
);

CREATE TABLE aceptaciones_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    documento_id UUID NOT NULL REFERENCES documentos_legales(id) ON DELETE RESTRICT,
    fecha_aceptacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_aceptaciones_usuario_documento UNIQUE (usuario_id, documento_id)
);

-- -------------------------------------------------------------------------
-- 4. MÓDULO DE EMPRENDIMIENTOS
-- -------------------------------------------------------------------------

CREATE TABLE categorias_emprendimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado estado_registro NOT NULL DEFAULT 'activo'
);

CREATE TABLE emprendimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES categorias_emprendimiento(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    descripcion TEXT,
    historia TEXT,
    telefono_whatsapp VARCHAR(20) NOT NULL,
    estado estado_emprendimiento NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ
);

CREATE INDEX idx_emprendimientos_categoria ON emprendimientos (categoria_id);
CREATE INDEX idx_emprendimientos_estado ON emprendimientos (estado);

CREATE TABLE redes_sociales_emprendimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE CASCADE,
    plataforma VARCHAR(50) NOT NULL,
    url TEXT NOT NULL
);

CREATE INDEX idx_redes_emprendimiento ON redes_sociales_emprendimiento (emprendimiento_id);

CREATE TABLE imagenes_emprendimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imagenes_emprendimiento ON imagenes_emprendimiento (emprendimiento_id);
CREATE UNIQUE INDEX uq_imagenes_emprendimiento_principal
    ON imagenes_emprendimiento (emprendimiento_id)
    WHERE es_principal = TRUE;

-- -------------------------------------------------------------------------
-- 5. MÓDULO DE GEOGRAFÍA Y UBICACIONES (ECUADOR)
-- -------------------------------------------------------------------------

CREATE TABLE provincias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE cantones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provincia_id UUID NOT NULL REFERENCES provincias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT uq_cantones_provincia_nombre UNIQUE (provincia_id, nombre)
);

CREATE TABLE parroquias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canton_id UUID NOT NULL REFERENCES cantones(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    CONSTRAINT uq_parroquias_canton_nombre UNIQUE (canton_id, nombre),
    CONSTRAINT uq_parroquias_id_canton UNIQUE (id, canton_id)
);

CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE CASCADE,
    canton_id UUID NOT NULL REFERENCES cantones(id) ON DELETE RESTRICT,
    parroquia_id UUID,
    nombre_sucursal VARCHAR(150),
    direccion TEXT NOT NULL,
    referencia TEXT,
    horario_texto VARCHAR(150),
    coordenadas GEOGRAPHY(POINT, 4326) NOT NULL,
    estado estado_registro NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    -- Si parroquia_id no es NULL, obliga a que pertenezca al canton_id elegido
    CONSTRAINT fk_ubicaciones_parroquia_canton
        FOREIGN KEY (parroquia_id, canton_id)
        REFERENCES parroquias (id, canton_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_ubicaciones_emprendimiento ON ubicaciones (emprendimiento_id);
CREATE INDEX idx_ubicaciones_canton ON ubicaciones (canton_id);
CREATE INDEX idx_ubicaciones_parroquia ON ubicaciones (parroquia_id);
CREATE INDEX idx_ubicaciones_coordenadas_gist ON ubicaciones USING GIST (coordenadas);

-- -------------------------------------------------------------------------
-- 6. MÓDULO DE CATÁLOGO DE PRODUCTOS
-- -------------------------------------------------------------------------

CREATE TABLE categorias_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado estado_registro NOT NULL DEFAULT 'activo'
);

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES categorias_producto(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado estado_registro NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ
);

CREATE INDEX idx_productos_emprendimiento ON productos (emprendimiento_id);
CREATE INDEX idx_productos_categoria ON productos (categoria_id);
CREATE INDEX idx_productos_estado ON productos (estado);

CREATE TABLE presentaciones_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2),
    requiere_cotizacion BOOLEAN NOT NULL DEFAULT FALSE,
    estado estado_registro NOT NULL DEFAULT 'activo',
    CONSTRAINT chk_presentaciones_precio CHECK (
        (requiere_cotizacion = TRUE AND (precio IS NULL OR precio >= 0))
        OR (requiere_cotizacion = FALSE AND precio IS NOT NULL AND precio >= 0)
    )
);

CREATE INDEX idx_presentaciones_producto ON presentaciones_producto (producto_id);

CREATE TABLE imagenes_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imagenes_producto ON imagenes_producto (producto_id);
CREATE UNIQUE INDEX uq_imagenes_producto_principal
    ON imagenes_producto (producto_id)
    WHERE es_principal = TRUE;

-- -------------------------------------------------------------------------
-- 7. MÓDULO DE PEDIDOS Y DETALLES
-- -------------------------------------------------------------------------

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido VARCHAR(20) NOT NULL UNIQUE
        DEFAULT ('PED-' || LPAD(nextval('seq_codigo_pedido')::TEXT, 6, '0')),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE RESTRICT,
    nombre_emprendimiento_snapshot VARCHAR(150) NOT NULL,
    whatsapp_emprendimiento_snapshot VARCHAR(20) NOT NULL,
    nota_comprador TEXT,
    total_referencial NUMERIC(12, 2) CHECK (total_referencial IS NULL OR total_referencial >= 0),
    estado estado_pedido NOT NULL DEFAULT 'nuevo',
    comprador_confirmo_recepcion BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_confirmacion_comprador TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    CONSTRAINT uq_pedidos_integridad_resena UNIQUE (id, usuario_id, emprendimiento_id),
    CONSTRAINT chk_pedidos_confirmacion_coherente CHECK (
        NOT (estado = 'cancelado' AND comprador_confirmo_recepcion = TRUE)
    )
);

CREATE INDEX idx_pedidos_usuario ON pedidos (usuario_id);
CREATE INDEX idx_pedidos_emprendimiento ON pedidos (emprendimiento_id);
CREATE INDEX idx_pedidos_estado ON pedidos (estado);
CREATE INDEX idx_pedidos_fecha_creacion ON pedidos (fecha_creacion DESC);

CREATE TABLE detalles_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    presentacion_id UUID REFERENCES presentaciones_producto(id) ON DELETE SET NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    nombre_presentacion VARCHAR(100) NOT NULL,
    requiere_cotizacion BOOLEAN NOT NULL DEFAULT FALSE,
    precio_unitario NUMERIC(12, 2),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    CONSTRAINT chk_detalles_precio CHECK (
        (requiere_cotizacion = TRUE AND (precio_unitario IS NULL OR precio_unitario >= 0))
        OR (requiere_cotizacion = FALSE AND precio_unitario IS NOT NULL AND precio_unitario >= 0)
    )
);

CREATE INDEX idx_detalles_pedido_pedido ON detalles_pedido (pedido_id);
CREATE INDEX idx_detalles_pedido_presentacion ON detalles_pedido (presentacion_id);

-- -------------------------------------------------------------------------
-- 8. MÓDULO DE CONFIANZA, RESEÑAS, FAVORITOS Y MODERACIÓN
-- -------------------------------------------------------------------------

CREATE TABLE resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    emprendimiento_id UUID NOT NULL,
    valoracion INTEGER NOT NULL CHECK (valoracion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    -- Garantiza que quien reseña es exactamente el comprador de ese pedido en esa tienda
    CONSTRAINT fk_resenas_pedido_exacto
        FOREIGN KEY (pedido_id, usuario_id, emprendimiento_id)
        REFERENCES pedidos (id, usuario_id, emprendimiento_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_resenas_emprendimiento ON resenas (emprendimiento_id);
CREATE INDEX idx_resenas_usuario ON resenas (usuario_id);

CREATE TABLE emprendimientos_favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_favoritos_usuario_emprendimiento UNIQUE (usuario_id, emprendimiento_id)
);

CREATE TABLE productos_favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_favoritos_usuario_producto UNIQUE (usuario_id, producto_id)
);

CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reportado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE RESTRICT,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    motivo motivo_reporte NOT NULL,
    descripcion TEXT NOT NULL,
    estado estado_reporte NOT NULL DEFAULT 'pendiente',
    resuelto_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    resolucion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ
);

CREATE INDEX idx_reportes_emprendimiento ON reportes (emprendimiento_id);
CREATE INDEX idx_reportes_estado ON reportes (estado);
CREATE INDEX idx_reportes_usuario ON reportes (reportado_por);

CREATE TABLE moderaciones_emprendimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emprendimiento_id UUID NOT NULL REFERENCES emprendimientos(id) ON DELETE RESTRICT,
    administrador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    reporte_id UUID REFERENCES reportes(id) ON DELETE SET NULL,
    accion accion_moderacion NOT NULL,
    motivo TEXT NOT NULL,
    fecha_moderacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderaciones_emprendimiento ON moderaciones_emprendimiento (emprendimiento_id);
CREATE INDEX idx_moderaciones_administrador ON moderaciones_emprendimiento (administrador_id);

-- -------------------------------------------------------------------------
-- 9. TRIGGERS DE AUDITORÍA BÁSICA (fecha_actualizacion)
-- -------------------------------------------------------------------------

CREATE TRIGGER trg_usuarios_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

CREATE TRIGGER trg_emprendimientos_actualizacion
    BEFORE UPDATE ON emprendimientos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

CREATE TRIGGER trg_ubicaciones_actualizacion
    BEFORE UPDATE ON ubicaciones
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

CREATE TRIGGER trg_productos_actualizacion
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

CREATE TRIGGER trg_pedidos_actualizacion
    BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

CREATE TRIGGER trg_resenas_actualizacion
    BEFORE UPDATE ON resenas
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_modificacion();

-- -------------------------------------------------------------------------
-- 10. DATOS SEMILLA INICIALES (ROLES BASE)
-- -------------------------------------------------------------------------

INSERT INTO roles (nombre, descripcion) VALUES
    ('consumidor', 'Usuario general que explora emprendimientos, gestiona favoritos, realiza pedidos y publica reseñas.'),
    ('emprendedor', 'Propietario de un emprendimiento que administra su tienda, ubicaciones, catálogo y pedidos.'),
    ('administrador', 'Operador autorizado para moderar reportes, suspender tiendas, gestionar categorías y consultar estadísticas.')
ON CONFLICT (nombre) DO NOTHING;