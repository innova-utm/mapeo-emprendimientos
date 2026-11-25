# ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE (SRS) Y DOCUMENTACIÓN DE BASE DE DATOS

**Proyecto:** Plataforma Digital de Mapeo, Descubrimiento y Promoción de Emprendimientos  
**Versión del documento:** 2.0 (Línea Base Definitiva para Desarrollo)  
**Ámbito territorial:** República del Ecuador  
**Entidad impulsora / administradora:** Innova *(proyecto de acceso público, independiente de la UTM)*  
**Motor de base de datos:** PostgreSQL 14+ con extensión PostGIS  

---

## 1. Control del Documento y Propósito

### 1.1. Propósito del documento
Este documento constituye la línea base funcional, arquitectónica y de datos para el diseño, desarrollo, despliegue y mantenimiento de la plataforma de emprendimientos. Su redacción está orientada a garantizar la **continuidad técnica del proyecto**: cualquier desarrollador, analista o pasante que se incorpore posteriormente podrá comprender el porqué de cada decisión de diseño, las reglas de negocio vigentes, el alcance exacto de los módulos y la estructura física completa de la base de datos.

### 1.2. Evolución y decisiones de arquitectura vigentes
Durante la etapa de análisis se refinó el alcance original para construir un producto viable, escalable a nivel nacional y financieramente sostenible. Las decisiones estructurales definitivas son:

1. **Acceso sin fricción y registro abierto por WhatsApp:** Se descartó el flujo de pre-aprobación manual de tiendas y de cambios de ubicación por parte de administradores, ya que genera cuellos de botella operativos a escala nacional. En su lugar, cualquier emprendedor en Ecuador puede crear y administrar su tienda inmediatamente tras verificar su número telefónico vía WhatsApp.
2. **Seguridad basada en trazabilidad y moderación reactiva:** Al no realizar validación legal de identidad (KYC) por costos y alcance, la prevención de fraudes se apoya en cinco controles combinados: (a) verificación obligatoria de número telefónico, (b) reseñas vinculadas estrictamente a pedidos reales, (c) sistema de reportes ciudadanos, (d) suspensión rápida de tiendas desde el panel administrativo con historial de moderación, y (e) avisos visibles anti-estafas antes de concretar acuerdos fuera de la aplicación.
3. **Vitrina comercial sin intermediación financiera ni logística:** La plataforma facilita el descubrimiento, la geolocalización y el armado de pedidos, delegando la coordinación del pago y la entrega a una conversación directa en WhatsApp. La aplicación no procesa, retiene ni garantiza dinero ni envíos.
4. **Independencia institucional:** Aunque Innova actúa como entidad solicitante y administradora operativa, la plataforma es pública para todo Ecuador y no exige vínculo con la Universidad Técnica de Manabí (UTM) ni debe presentarse como un servicio institucional exclusivo.

---

## 2. Descripción General de la Aplicación

### 2.1. Planteamiento del problema
Numerosos emprendimientos ecuatorianos —especialmente productores artesanales, agroindustriales, gastronómicos y de bienes innovadores— carecen de visibilidad digital estructurada. Sus potenciales clientes tienen dificultades para descubrir qué productos existen en su localidad, ubicar puntos físicos de venta o retiro confiables y realizar pedidos organizados sin depender de redes sociales dispersas.

### 2.2. Solución propuesta
Una plataforma compuesta por una **aplicación móvil** (para consumidores y emprendedores) y un **panel web administrativo** (para operadores de Innova), respaldados por una API REST centralizada y una base de datos geoespacial.

* **Para consumidores:** Permite explorar emprendimientos y productos sin necesidad de crear cuenta, buscar y filtrar por categorías, localizar puntos de venta en un mapa interactivo con cálculo de proximidad, guardar favoritos, armar un carrito multivendedor y generar pedidos separados que abren directamente el chat de WhatsApp de cada emprendedor con el detalle estructurado.
* **Para emprendedores:** Permite registrar y administrar su propio emprendimiento, definir su catálogo con múltiples presentaciones (con precio fijo o bajo cotización), gestionar una o más ubicaciones físicas con coordenadas en mapa y dar seguimiento al estado de los pedidos recibidos.
* **Para administradores:** Provee un tablero de control enfocado en la operación real: gestión de catálogos (categorías), atención de reportes de usuarios, moderación/suspensión de emprendimientos y visualización de estadísticas agregadas por categoría, actividad comercial y distribución geográfica en Ecuador.

### 2.3. Límites explícitos y exclusiones del alcance (Fuera del MVP)
Para evitar desviaciones de alcance, el sistema **NO** contempla en su versión inicial:

* Pasarelas de pago, billeteras virtuales, cobro de comisiones o custodia de fondos.
* Gestión de repartidores, cálculo de tarifas de envío o rastreo logístico en tiempo real.
* Chat interno en tiempo real (toda mensajería comercial ocurre en WhatsApp).
* Validación biométrica o consulta de identidad legal ante registros civiles.
* Sistema de pre-aprobación manual para alta de emprendimientos o modificación de direcciones.
* Motor complejo de horarios por franjas/feriados (se sustituye por un campo referencial de texto libre por ubicación).
* Sistema automatizado de rangos, puntos o gamificación (pospuesto a fases posteriores con datos históricos reales).
* Recomendaciones mediante inteligencia artificial, ferias/eventos o auditoría técnica como módulo independiente.

---

## 3. Actores del Sistema y Matriz de Permisos

El control de acceso se implementa mediante **RBAC (Role-Based Access Control)** verificado obligatoriamente en el servidor (backend) según el rol almacenado en la tabla `roles` y las reglas de propiedad del recurso.

| Actor | Descripción | Capacidades Principales |
| :--- | :--- | :--- |
| **Visitante (No autenticado)** | Cualquier persona que abre la aplicación sin iniciar sesión. | Explorar tiendas y productos activos, buscar, filtrar, usar el mapa interactivo, navegar externamente, compartir fichas y armar el carrito temporal en su dispositivo. |
| **Consumidor** (`consumidor`) | Usuario registrado con número telefónico verificado vía WhatsApp. | Todo lo del Visitante + generar pedidos (con redirección a WhatsApp), consultar su historial y estados de pedidos, confirmar recepción, gestionar favoritos, publicar reseñas de pedidos reales y enviar reportes. |
| **Emprendedor** (`emprendedor`) | Usuario verificado propietario de un único emprendimiento (relación 1:1). | Todo lo del Consumidor + crear y administrar su tienda, redes sociales, imágenes, ubicaciones en mapa, catálogo de productos/presentaciones y actualizar estados de los pedidos recibidos. |
| **Administrador** (`administrador`) | Operador autorizado de la plataforma (Innova). | Acceder al panel web administrativo, gestionar categorías de tiendas y productos, gestionar documentos legales, revisar reportes, advertir/suspender/reactivar emprendimientos y consultar estadísticas privadas. |

---

## 4. Reglas de Negocio Consolidadas

Estas reglas gobiernan la lógica del backend y las restricciones de la base de datos. Ninguna interfaz cliente debe asumir su cumplimiento sin validación en el servidor.

| Código | Nombre | Descripción Detallada |
| :--- | :--- | :--- |
| **RN-01** | Acceso público nacional | Toda persona en Ecuador puede consultar emprendimientos y productos activos sin autenticación y sin pertenecer a UTM ni a Innova. |
| **RN-02** | Autenticación por teléfono verificado | El identificador principal de cuenta para consumidores y emprendedores es el número telefónico (formato E.164), validado mediante código único vía WhatsApp. El correo electrónico es opcional como dato de contacto; la contraseña es obligatoria únicamente para cuentas con rol `administrador`. |
| **RN-03** | Aceptación legal obligatoria | Todo usuario debe aceptar expresamente la versión vigente de los Términos de Uso y la Política de Privacidad (en cumplimiento de la LOPDP de Ecuador) al registrarse, dejando registro inmutable en `aceptaciones_documentos`. |
| **RN-04** | Titularidad única 1:1 | Cada usuario con rol emprendedor puede ser dueño de un único emprendimiento y cada emprendimiento tiene un único propietario (`emprendimientos.usuario_id` es `UNIQUE`). Un emprendedor solo puede modificar recursos pertenecientes a su propia tienda. |
| **RN-05** | Operación territorial ecuatoriana | Las ubicaciones registradas deben pertenecer a un cantón válido de Ecuador y sus coordenadas geográficas deben ubicarse dentro de los límites geográficos del territorio ecuatoriano (incluyendo región insular). |
| **RN-06** | Ubicación pública voluntaria | Las coordenadas e información ingresadas en `ubicaciones` corresponden exclusivamente al punto público de venta, atención o retiro que el emprendedor decide exponer; no debe asumirse como domicilio privado. Un emprendimiento puede tener cero, una o varias ubicaciones activas. |
| **RN-07** | Carrito local y frontera de autenticación | El carrito multivendedor se gestiona localmente en el dispositivo del usuario sin requerir sesión. Sin embargo, para confirmar y persistir los pedidos en base de datos, el usuario debe estar autenticado con teléfono verificado. |
| **RN-08** | División automática multivendedor | Cada pedido pertenece a un único emprendimiento. Si el carrito contiene productos de $N$ emprendimientos distintos, el sistema generará exactamente $N$ registros independientes en `pedidos`, cada uno con su propio código legible y enlace a WhatsApp. |
| **RN-09** | Integridad histórica (Snapshot) | Al crear un pedido, el sistema guarda una copia inmutable del nombre comercial, número de WhatsApp del vendedor, nombre del producto, presentación, indicador de cotización y precio unitario vigente. Cambios o eliminaciones posteriores en el catálogo nunca alteran pedidos históricos. |
| **RN-10** | Disponibilidad y cotización | No se pueden incluir en nuevos pedidos productos o presentaciones con estado `inactivo`, ni pertenecientes a emprendimientos `inactivos` o `suspendidos`. Si una presentación tiene `requiere_cotizacion = true`, su precio puede ser nulo y el subtotal/total referencial excluirá o marcará dichos ítems como "por cotizar". |
| **RN-11** | Ciclo de vida de pedidos | Todo pedido inicia en estado `nuevo`. El emprendedor puede transicionar estados siguiendo el flujo: `nuevo` $\rightarrow$ `confirmado` $\rightarrow$ `preparando` $\rightarrow$ `entregado`, o bien a `cancelado` (desde estados no entregados). Abrir el enlace de WhatsApp **no** altera el estado del pedido ni equivale a una venta confirmada. |
| **RN-12** | Confirmación de recepción y no contradicción | El comprador puede marcar `comprador_confirmo_recepcion = true` sobre un pedido no cancelado para avalar la entrega real. Un pedido `cancelado` jamás puede tener confirmación de recepción activa. |
| **RN-13** | Criterio de venta contabilizable | Las estadísticas administrativas de ventas exitosas solo contabilizan pedidos en estado `entregado` (y permiten diferenciar aquellos que cuentan además con confirmación explícita del comprador). |
| **RN-14** | Reseñas verificadas por pedido | Un usuario solo puede calificar (1 a 5 estrellas) y comentar a un emprendimiento si posee un pedido real en estado `entregado` (o con recepción confirmada) con dicho emprendimiento. Se admite máximo una reseña por pedido (`resenas.pedido_id` es `UNIQUE`). |
| **RN-15** | Descargo financiero y aviso anti-estafas | Antes de redirigir a WhatsApp, la aplicación debe mostrar un recordatorio claro indicando que la plataforma no procesa pagos ni garantiza transacciones externas. |
| **RN-16** | Moderación reactiva y visibilidad | Cuando un administrador suspende un emprendimiento (`estado = 'suspendido'`), este y sus productos desaparecen de las búsquedas, el mapa y la creación de nuevos pedidos, pero se conserva todo su historial de pedidos, reseñas y reportes para auditoría administrativa. |

---

## 5. Requerimientos Funcionales por Módulo

**Convenciones de prioridad:**
* **P0 (Crítico / Fundacional):** Indispensable para operar el núcleo y garantizar seguridad e integridad de datos.
* **P1 (Esencial MVP):** Requerido para que la primera versión en producción sea completa y útil.
* **P2 (Complementario):** Aporta valor y analítica adicional sin bloquear el lanzamiento central.

### Módulo 1: Acceso, Autenticación por WhatsApp y Cumplimiento Legal

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-AUT-01** | Solicitar código de verificación (OTP) mediante número telefónico vía WhatsApp para registro o inicio de sesión. | Visitante / Consumidor / Emprendedor | P0 | Almacena hash del código en `codigos_verificacion` con expiración (ej. 5–10 min). Soporta envío por WhatsApp Cloud API o flujo de verificación inversa (mensaje entrante del usuario hacia el número oficial vía webhook para costo cero). |
| **RF-AUT-02** | Validar el código de verificación recibido, limitar intentos fallidos y emitir sesión autenticada (JWT). | Sistema / Usuario | P0 | Incrementa `intentos` en cada fallo; bloquea el código tras máximo 5 intentos o al superar `fecha_expiracion`. Marca `telefono_verificado = true` y registra `fecha_utilizacion`. |
| **RF-AUT-03** | Completar el registro de cuenta básica ingresando nombres, apellidos y correo electrónico opcional, junto con la aceptación de documentos legales vigentes. | Visitante | P0 | Asigna por defecto el rol `consumidor`. Registra filas en `aceptaciones_documentos` por cada documento legal activo obligatorio. |
| **RF-AUT-04** | Iniciar y cerrar sesión de forma segura, incluyendo renovación de tokens. | Consumidor / Emprendedor / Administrador | P0 | Los administradores inician sesión mediante credenciales (correo/teléfono + contraseña con hash seguro) desde el panel web. |
| **RF-AUT-05** | Consultar y actualizar datos personales básicos (nombres, apellidos, correo de contacto). | Consumidor / Emprendedor | P1 | El cambio de número telefónico exige un nuevo flujo OTP con `proposito = 'cambio_telefono'`. |
| **RF-AUT-06** | Consultar en cualquier momento los documentos legales vigentes (Términos de Uso y Política de Privacidad). | Todos | P1 | Consume los registros activos de `documentos_legales`. |

### Módulo 2: Descubrimiento, Búsqueda y Catálogo Público

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-DES-01** | Explorar el listado paginado de emprendimientos activos sin necesidad de iniciar sesión. | Visitante / Consumidor | P0 | Solo retorna emprendimientos con `estado = 'activo'`, mostrando imagen principal, nombre, categoría, calificación promedio y cantidad de reseñas. |
| **RF-DES-02** | Consultar la ficha completa de un emprendimiento: nombre, categoría, descripción, historia, galería de imágenes, redes sociales, ubicaciones activas y reseñas. | Visitante / Consumidor | P0 | Resuelve también acceso directo mediante `slug` único. |
| **RF-DES-03** | Consultar el catálogo de productos activos publicados por un emprendimiento, incluyendo imágenes y presentaciones disponibles. | Visitante / Consumidor | P0 | Filtra productos y presentaciones con `estado = 'activo'`. Muestra precio o etiqueta `"Bajo cotización"` cuando `requiere_cotizacion = true`. |
| **RF-DES-04** | Buscar emprendimientos y productos por texto libre (nombre o descripción). | Visitante / Consumidor | P1 | Debe funcionar independientemente de si el usuario otorgó permisos de GPS. |
| **RF-DES-05** | Filtrar emprendimientos por categoría de emprendimiento y ubicación territorial (provincia/cantón), y filtrar productos por categoría de producto y rango de precio. | Visitante / Consumidor | P1 | Permite combinar texto + categoría + ubicación. |
| **RF-DES-06** | Generar un enlace compartible (deep link / URL amigable con `slug`) de un emprendimiento o producto para difundirlo por WhatsApp u otras apps. | Visitante / Consumidor / Emprendedor | P1 | Facilita crecimiento orgánico sin costo publicitario. |

### Módulo 3: Geolocalización y Mapas Interactivos

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-MAP-01** | Visualizar emprendimientos con ubicaciones activas en un mapa interactivo con marcadores agrupables (clustering). | Visitante / Consumidor | P1 | Consulta espacial sobre `ubicaciones` filtrando emprendimientos y ubicaciones en estado `activo`. |
| **RF-MAP-02** | Seleccionar un marcador en el mapa para abrir una tarjeta resumida (nombre, categoría, horario referencial, distancia aproximada y botón para ver ficha). | Visitante / Consumidor | P1 | Evita cargar toda la ficha hasta que el usuario decida ingresar. |
| **RF-MAP-03** | Alternar entre vista de resultados en lista y vista de mapa conservando los filtros aplicados. | Visitante / Consumidor | P1 | Mantiene el estado de búsqueda y categoría activa. |
| **RF-MAP-04** | Solicitar permiso de geolocalización explicando su finalidad y calcular la distancia aproximada hacia cada ubicación activa (con opción de ordenar por cercanía o filtrar por radio). | Visitante / Consumidor | P1 | Utiliza `ST_Distance` / `ST_DWithin` de PostGIS aprovechando el índice `GIST`. Si el permiso es denegado, la app continúa operando normalmente sin bloquear búsqueda ni mapa manual. |
| **RF-MAP-05** | Abrir una aplicación externa de navegación (Google Maps, Waze u otra instalada) con las coordenadas de la ubicación seleccionada. | Visitante / Consumidor | P1 | Utiliza URI estándar de coordenadas (`lat,lng`) del punto `GEOGRAPHY(POINT, 4326)`. |

### Módulo 4: Gestión de Emprendimiento, Ubicaciones y Catálogo (Emprendedor)

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-EMP-01** | Crear un emprendimiento desde una cuenta verificada, pasando el usuario al rol `emprendedor` y publicando la tienda de forma inmediata. | Consumidor $\rightarrow$ Emprendedor | P0 | Valida que el usuario no posea ya un emprendimiento. Genera automáticamente un `slug` único y solicita `telefono_whatsapp` comercial (precargado por defecto con `usuarios.telefono`, editable). |
| **RF-EMP-02** | Editar los datos comerciales del emprendimiento (nombre, categoría, descripción, historia, teléfono de WhatsApp y estado `activo`/`inactivo`). | Emprendedor | P0 | Un emprendedor **no** puede reactivar por sí mismo una tienda que esté en estado `suspendido` por un administrador. |
| **RF-EMP-03** | Gestionar redes sociales (agregar, editar, eliminar enlaces) e imágenes del emprendimiento (subir, eliminar, marcar una como imagen principal). | Emprendedor | P1 | El backend garantiza transaccionalmente que solo exista una imagen con `es_principal = true`. |
| **RF-EMP-04** | Registrar, editar y activar/desactivar una o más ubicaciones públicas del emprendimiento seleccionando provincia, cantón, parroquia (opcional), dirección, referencia, horario en texto libre y punto en mapa. | Emprendedor | P0 | El backend valida que `parroquia_id` (si se envía) pertenezca a `canton_id` y que las coordenadas caigan dentro del polígono/bounding box de Ecuador. |
| **RF-EMP-05** | Crear, editar y activar/desactivar productos propios asignándoles categoría, nombre y descripción. | Emprendedor | P0 | Desactivar un producto lo oculta del catálogo público sin afectar pedidos históricos. |
| **RF-EMP-06** | Gestionar presentaciones (variantes) de cada producto, definiendo nombre (ej. "Frasco 250g", "Caja x6"), descripción, precio o indicador `requiere_cotizacion` y estado. | Emprendedor | P0 | Todo producto publicado debe tener al menos una presentación activa. |
| **RF-EMP-07** | Subir, eliminar y definir la imagen principal de cada producto. | Emprendedor | P1 | Las imágenes se optimizan/comprimen antes de almacenarse en el servicio de objetos. |

### Módulo 5: Carrito Multivendedor y Pedidos mediante WhatsApp

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-PED-01** | Agregar presentaciones activas de uno o varios emprendimientos al carrito, modificar cantidades y eliminar ítems. | Visitante / Consumidor | P0 | Persistido localmente en el dispositivo. Muestra ítems agrupados por emprendimiento, subtotales referenciales y leyenda clara para productos a cotizar. |
| **RF-PED-02** | Agregar una nota opcional por emprendimiento (instrucciones de retiro, preguntas o preferencia de entrega) antes de generar el pedido. | Consumidor | P1 | Se almacena en `pedidos.nota_comprador`. |
| **RF-PED-03** | Confirmar el carrito generando automáticamente un pedido independiente por cada emprendimiento presente, validando disponibilidad actual y guardando el *snapshot* histórico. | Consumidor | P0 | Requiere sesión verificada. Ejecuta validación en backend dentro de una transacción ACID. Asigna `codigo_pedido` legible (`PED-XXXXXX`) y limpia del carrito los ítems procesados. |
| **RF-PED-04** | Mostrar un aviso breve anti-estafas y abrir WhatsApp (`wa.me`) con el número comercial del emprendedor y un mensaje preestructurado con código de pedido, productos, cantidades, precios referenciales y nota. | Consumidor | P0 | Si el carrito generó múltiples pedidos, presenta una pantalla de confirmación listando cada pedido con su botón individual `"Enviar por WhatsApp"`. Abrir WhatsApp no cambia el estado `nuevo`. |
| **RF-PED-05** | Consultar el historial de pedidos realizados por el consumidor, su detalle histórico y su estado actual. | Consumidor | P1 | Permite volver a abrir WhatsApp para retomar la conversación sobre un pedido específico. |
| **RF-PED-06** | Consultar el listado de pedidos recibidos por el emprendimiento, filtrables por estado y fecha. | Emprendedor | P1 | Muestra datos de contacto del comprador, código de pedido, ítems solicitados y nota. |
| **RF-PED-07** | Actualizar el estado de un pedido recibido (`nuevo` $\rightarrow$ `confirmado` $\rightarrow$ `preparando` $\rightarrow$ `entregado`, o `cancelado`). | Emprendedor | P1 | El backend valida transiciones permitidas e impide modificar pedidos ya finalizados (`entregado` o `cancelado`). |
| **RF-PED-08** | Confirmar la recepción del pedido desde la cuenta del comprador. | Consumidor | P1 | Actualiza `comprador_confirmo_recepcion = true` y `fecha_confirmacion_comprador`. Desbloquea la invitación directa a calificar al emprendimiento. |

### Módulo 6: Confianza, Favoritos, Reseñas y Reportes

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-CON-01** | Agregar, quitar y listar emprendimientos y productos favoritos. | Consumidor | P1 | Utiliza restricciones de unicidad por usuario para evitar duplicados. |
| **RF-CON-02** | Publicar o editar una reseña (calificación de 1 a 5 estrellas y comentario opcional) vinculada a un pedido completado. | Consumidor | P2 | Solo habilitado para pedidos del usuario con estado `entregado` (o recepción confirmada) que aún no tengan reseña registrada. |
| **RF-CON-03** | Reportar a un emprendimiento (y opcionalmente vincular un pedido específico) indicando un motivo tipificado y una descripción del incidente. | Consumidor | P0 | Crea un registro en `reportes` con estado `pendiente`. Pieza clave del modelo anti-estafas reactivo. |

### Módulo 7: Panel Administrativo, Moderación y Estadísticas

| ID | Requerimiento Funcional | Actor | Prioridad | Notas Técnicas / Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **RF-ADM-01** | Crear, editar y activar/desactivar categorías de emprendimientos y categorías de productos. | Administrador | P1 | Impide eliminar físicamente categorías con registros asociados (`ON DELETE RESTRICT`). |
| **RF-ADM-02** | Consultar la bandeja de reportes ciudadanos filtrables por estado (`pendiente`, `en_revision`, `resuelto`, `descartado`) y motivo, y registrar su resolución. | Administrador | P0 | Registra `resuelto_por`, `resolucion` y `fecha_resolucion`. |
| **RF-ADM-03** | Consultar el directorio completo de emprendimientos (activos, inactivos, suspendidos) y ejecutar acciones de moderación (`advertencia`, `suspension`, `reactivacion`) con motivo obligatorio. | Administrador | P0 | Actualiza `emprendimientos.estado` (cuando corresponde) e inserta el registro histórico en `moderaciones_emprendimiento`, vinculando opcionalmente el `reporte_id`. |
| **RF-ADM-04** | Gestionar versiones de documentos legales (publicar nuevas versiones y desactivar anteriores). | Administrador | P1 | Conserva el historial de aceptaciones de versiones anteriores. |
| **RF-ADM-05** | Visualizar un tablero de estadísticas agregadas: total de emprendimientos por estado, productos activos, usuarios verificados y pedidos desglosados por estado. | Administrador | P1 | Acceso estrictamente bloqueado a roles no administrativos. |
| **RF-ADM-06** | Consultar distribución de emprendimientos por categoría y por ubicación geográfica (provincia/cantón), así como indicadores de actividad comercial (tiendas con mayor volumen de pedidos entregados y mejor calificación). | Administrador | P2 | Excluye pedidos `cancelados` o meramente `nuevos` de las métricas de ventas efectivas. |

---

## 6. Requerimientos No Funcionales (RNF)

| ID | Categoría | Requerimiento No Funcional | Prioridad |
| :--- | :--- | :--- | :---: |
| **RNF-01** | Seguridad en tránsito | Toda comunicación entre la app móvil, el panel web y el backend debe cifrarse mediante HTTPS/TLS 1.2+. | P0 |
| **RNF-02** | Protección de secretos | Los códigos OTP (`codigo_hash`) y contraseñas administrativas (`contrasena`) deben almacenarse exclusivamente mediante algoritmos criptográficos de hashing seguro (ej. Argon2id o bcrypt); nunca en texto plano. | P0 |
| **RNF-03** | Protección contra abuso (Rate Limiting) | Los endpoints de solicitud y validación de OTP, creación de pedidos y envío de reportes deben aplicar límites de tasa (*rate limiting*) por IP y por número telefónico para prevenir ataques de fuerza bruta y *OTP pumping*. | P0 |
| **RNF-04** | Autorización en servidor | Todo endpoint protegido debe validar identidad, rol y propiedad del recurso en el backend (guards/middlewares), sin confiar en ocultamientos del lado cliente. | P0 |
| **RNF-05** | Privacidad y cumplimiento legal | El tratamiento de datos personales (teléfonos, nombres, correos, historial) debe cumplir la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, recabando consentimiento verificable (`aceptaciones_documentos`) y exponiendo solo datos comerciales públicos. | P0 |
| **RNF-06** | Integridad de datos | Las reglas críticas de consistencia (unicidad, rangos numéricos, precios vs cotización, coherencia territorial y pertenencia de reseñas a pedidos) deben reforzarse simultáneamente en el backend y mediante restricciones nativas en PostgreSQL. | P0 |
| **RNF-07** | Rendimiento geoespacial y paginación | Las consultas de proximidad deben usar índices espaciales `GIST` de PostGIS. Todo listado público o administrativo debe implementar paginación para mantener tiempos de respuesta promedio inferiores a 500 ms bajo carga normal. | P1 |
| **RNF-08** | Optimización de multimedia | Las imágenes cargadas deben validarse por tipo MIME/tamaño máximo, comprimirse y servirse en formatos web eficientes (ej. WebP/JPEG optimizado) desde almacenamiento de objetos compatible con S3 (CDN opcional). | P1 |
| **RNF-09** | Resiliencia y tolerancia a fallos | La denegación de permisos GPS, la ausencia temporal de red o fallos de servicios externos (mapas/WhatsApp) deben manejarse con mensajes claros sin colapsar la aplicación ni perder el carrito local. | P1 |
| **RNF-10** | Portabilidad territorial | El catálogo geográfico (`provincias`, `cantones`, `parroquias`) debe precargarse con la División Político-Administrativa (DPA) oficial del INEC Ecuador, sin valores quemados en código fuente para una sola ciudad. | P0 |
| **RNF-11** | Mantenibilidad y documentación API | El backend debe organizarse de forma modular por dominio, usar migraciones versionadas para cualquier cambio de esquema y exponer documentación OpenAPI/Swagger en entornos de desarrollo. | P1 |
| **RNF-12** | Respaldo y recuperación | La base de datos PostgreSQL debe contar con respaldos automáticos diarios con retención mínima de 14 días y un procedimiento documentado de restauración. | P1 |

---

## 7. Arquitectura Tecnológica de Referencia

La solución adopta una arquitectura cliente-servidor desacoplada basada en una API REST centralizada:

| Capa / Componente | Tecnología Recomendada | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Aplicación Móvil** | Ionic + Angular + Capacitor | Interfaz híbrida (Android/iOS) para Visitantes, Consumidores y Emprendedores. Gestiona el carrito local y la apertura de enlaces externos (`wa.me`, Google Maps). |
| **Panel Web Administrativo** | Angular (SPA) | Interfaz de escritorio ligera para el equipo de Innova (categorías, reportes, moderación y dashboard estadístico). |
| **Backend / API REST** | NestJS (TypeScript) | Lógica de negocio, autenticación JWT, verificación OTP, RBAC, validaciones DTO, cálculos estadísticos y orquestación de almacenamiento. |
| **ORM / Migraciones** | Prisma o TypeORM | Acceso tipado a datos y control versionado de migraciones SQL (con soporte para consultas *raw* de PostGIS donde aplique). |
| **Base de Datos** | PostgreSQL 14+ & PostGIS | Persistencia relacional transaccional y consultas geoespaciales (`GEOGRAPHY(POINT, 4326)`). |
| **Almacenamiento de Archivos** | Compatible con S3 (Cloudflare R2, AWS S3, Supabase Storage o MinIO) | Custodia de imágenes de emprendimientos, productos y archivos PDF/HTML de documentos legales. |
| **Mapas** | Leaflet + proveedor de teselas (OSM / MapTiler / Mapbox) | Renderizado interactivo de marcadores y selección de coordenadas. *(Nota: en producción evitar dependencia exclusiva del servidor público gratuito de teselas de OSM por sus límites de uso).* |
| **Integración WhatsApp** | Enlaces `wa.me` + WhatsApp Cloud API (o Webhook inverso) | Envío de pedidos sin costo (`wa.me`) y verificación de identidad telefónica por código OTP. |

---

## 8. Documentación Técnica de la Base de Datos

El modelo físico definitivo consta de **24 tablas** organizadas en **6 módulos funcionales**, **9 tipos enumerados (`ENUM`)**, **1 secuencia autogenerada**, **1 función disparadora (trigger)** y **6 triggers de auditoría temporal**. Todas las claves primarias emplean `UUID` generados nativamente mediante `gen_random_uuid()` y todas las marcas de tiempo utilizan `TIMESTAMPTZ` (almacenadas en UTC).

### 8.1. Tipos Enumerados (`ENUM`)

| Nombre del Tipo | Valores Permitidos | Propósito y Uso |
| :--- | :--- | :--- |
| `estado_usuario` | `activo`, `inactivo`, `suspendido` | Controla el ciclo de vida de una cuenta de usuario. |
| `canal_verificacion` | `whatsapp`, `correo` | Define el medio por el cual se tramita un código OTP. |
| `proposito_verificacion` | `registro`, `login`, `cambio_telefono`, `recuperacion` | Evita reutilizar un código emitido para una acción distinta a la solicitada. |
| `estado_registro` | `activo`, `inactivo` | Estado binario reutilizable para borrado lógico de catálogos, ubicaciones, productos, presentaciones y documentos. |
| `estado_emprendimiento` | `activo`, `inactivo`, `suspendido` | Diferencia la desactivación voluntaria por el dueño (`inactivo`) de la sanción administrativa (`suspendido`). |
| `estado_pedido` | `nuevo`, `confirmado`, `preparando`, `entregado`, `cancelado` | Máquina de estados oficial del ciclo comercial de pedidos. |
| `motivo_reporte` | `posible_estafa`, `producto_enganoso`, `incumplimiento_pedido`, `ubicacion_falsa`, `contenido_inapropiado`, `otro` | Clasificación estructurada de denuncias para priorización administrativa. |
| `estado_reporte` | `pendiente`, `en_revision`, `resuelto`, `descartado` | Seguimiento operativo de reportes en el panel de Innova. |
| `accion_moderacion` | `advertencia`, `suspension`, `reactivacion` | Tipo de medida administrativa aplicada sobre un emprendimiento. |

---

### 8.2. Diccionario de Tablas y Atributos

#### Módulo 1: Usuarios, Acceso y Cumplimiento Legal

##### 1. `roles`
Catálogo maestro de perfiles de autorización del sistema. Se inicializa mediante datos semilla con los roles `consumidor`, `emprendedor` y `administrador`.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del rol. |
| `nombre` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Nombre técnico único del rol (`consumidor`, `emprendedor`, `administrador`). |
| `descripcion` | `TEXT` | `NULL` | Explicación de responsabilidades del perfil. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de creación del registro. |

##### 2. `usuarios`
Almacena la identidad y credenciales de todas las personas registradas en la plataforma (consumidores, emprendedores y administradores).

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del usuario. |
| `rol_id` | `UUID` | `FK -> roles(id)`, `NOT NULL` | Rol vigente del usuario (`ON DELETE RESTRICT`). |
| `nombres` | `VARCHAR(100)` | `NOT NULL` | Nombres de la persona. |
| `apellidos` | `VARCHAR(100)` | `NOT NULL` | Apellidos de la persona. |
| `telefono` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE` | Número telefónico principal en formato internacional E.164 (ej. `+593991234567`). |
| `telefono_verificado` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Indica si el número fue confirmado exitosamente mediante WhatsApp. |
| `correo` | `VARCHAR(255)` | `UNIQUE`, `NULL` | Correo electrónico opcional de contacto (o identificador para administradores). |
| `correo_verificado` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Indica si el correo fue verificado. |
| `contrasena` | `VARCHAR(255)` | `NULL` | Hash criptográfico de contraseña. Nulo en cuentas 100% *passwordless* por OTP; obligatorio en administradores. |
| `estado` | `estado_usuario` | `NOT NULL`, `DEFAULT 'activo'` | Estado operativo de la cuenta. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de registro. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_usuarios_actualizacion`. |

* **Índices:** `idx_usuarios_rol (rol_id)`, `idx_usuarios_estado (estado)`.

##### 3. `codigos_verificacion`
Gestiona los códigos temporales (OTP) emitidos para registro, inicio de sesión, cambio de teléfono o recuperación.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del código. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NULL` | Usuario asociado (`ON DELETE CASCADE`). Puede ser `NULL` durante el pre-registro. |
| `destino` | `VARCHAR(255)` | `NOT NULL` | Teléfono E.164 o correo al cual corresponde el código. |
| `canal` | `canal_verificacion` | `NOT NULL` | Canal de validación (`whatsapp` o `correo`). |
| `proposito` | `proposito_verificacion` | `NOT NULL` | Finalidad estricta del código. |
| `codigo_hash` | `VARCHAR(255)` | `NOT NULL` | Hash del código OTP; nunca almacenar en texto plano. |
| `intentos` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (intentos >= 0)` | Contador de intentos fallidos para mitigación de fuerza bruta. |
| `fecha_expiracion` | `TIMESTAMPTZ` | `NOT NULL` | Instante límite de validez (`CHECK (fecha_expiracion > fecha_creacion)`). |
| `fecha_utilizacion` | `TIMESTAMPTZ` | `NULL` | Fecha en que fue consumido con éxito (impide reuso). |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de generación. |

* **Índices:** `idx_codigos_usuario (usuario_id)`, `idx_codigos_destino_canal (destino, canal, proposito)`.

##### 4. `documentos_legales`
Repositorio versionado de textos legales (Términos de Uso, Política de Privacidad, Descargo de Responsabilidad) exigidos por la normativa ecuatoriana.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del documento. |
| `nombre` | `VARCHAR(150)` | `NOT NULL` | Título legible (ej. *"Política de Protección de Datos Personales"*). |
| `tipo` | `VARCHAR(50)` | `NOT NULL` | Clasificador del documento (ej. `terminos_uso`, `privacidad`). |
| `version` | `VARCHAR(30)` | `NOT NULL` | Etiqueta de versión (ej. `1.0`, `2026.1`). |
| `contenido_url` | `TEXT` | `NOT NULL` | URL pública del archivo alojado en el almacenamiento de objetos. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Indica si la versión se encuentra vigente. |
| `fecha_publicacion` | `TIMESTAMPTZ` | `NULL` | Fecha oficial de entrada en vigor. |

* **Restricciones únicas:** `uq_documentos_tipo_version (tipo, version)`.

##### 5. `aceptaciones_documentos`
Registro probatorio de consentimiento de cada usuario frente a versiones específicas de documentos legales.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del registro de aceptación. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Usuario que otorgó el consentimiento (`ON DELETE RESTRICT`). |
| `documento_id` | `UUID` | `FK -> documentos_legales(id)`, `NOT NULL` | Versión exacta aceptada (`ON DELETE RESTRICT`). |
| `fecha_aceptacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Marca temporal exacta de aceptación. |

* **Restricciones únicas:** `uq_aceptaciones_usuario_documento (usuario_id, documento_id)`.

---

#### Módulo 2: Emprendimientos

##### 6. `categorias_emprendimiento`
Clasificación principal de los emprendimientos (ej. *Agroindustria*, *Gastronomía Artesanal*, *Cosmética Natural*, *Mascotas*), administrada por Innova.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único de la categoría. |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre visible de la categoría. |
| `descripcion` | `TEXT` | `NULL` | Detalle orientativo de la categoría. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Controla si está disponible para nuevos emprendimientos y filtros. |

##### 7. `emprendimientos`
Entidad central del comercio digital. Mantiene una relación estricta **1:1** con `usuarios`, eliminando la tabla redundante de emprendedores.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del emprendimiento. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL`, `UNIQUE` | Dueño único de la tienda (`ON DELETE RESTRICT`). |
| `categoria_id` | `UUID` | `FK -> categorias_emprendimiento(id)`, `NOT NULL` | Categoría principal (`ON DELETE RESTRICT`). |
| `nombre` | `VARCHAR(150)` | `NOT NULL` | Nombre comercial visible al público. |
| `slug` | `VARCHAR(180)` | `NOT NULL`, `UNIQUE` | Identificador amigable para enlaces compartibles (ej. `cafe-manabi-altura`). |
| `descripcion` | `TEXT` | `NULL` | Resumen comercial del negocio. |
| `historia` | `TEXT` | `NULL` | Relato de origen, proceso artesanal o propósito del emprendimiento. |
| `telefono_whatsapp` | `VARCHAR(20)` | `NOT NULL` | Número comercial de WhatsApp (E.164) hacia donde se redirigen los pedidos. |
| `estado` | `estado_emprendimiento` | `NOT NULL`, `DEFAULT 'activo'` | `activo` (visible), `inactivo` (pausado por dueño), `suspendido` (bloqueado por admin). |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de alta de la tienda. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_emprendimientos_actualizacion`. |

* **Índices:** `idx_emprendimientos_categoria (categoria_id)`, `idx_emprendimientos_estado (estado)`.

##### 8. `redes_sociales_emprendimiento`
Enlaces externos de canales digitales del emprendimiento (Instagram, Facebook, TikTok, sitio web).

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del enlace. |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Emprendimiento propietario (`ON DELETE CASCADE`). |
| `plataforma` | `VARCHAR(50)` | `NOT NULL` | Nombre de la red (ej. `instagram`, `facebook`, `tiktok`, `web`). |
| `url` | `TEXT` | `NOT NULL` | URL validada del perfil externo. |

* **Índices:** `idx_redes_emprendimiento (emprendimiento_id)`.

##### 9. `imagenes_emprendimiento`
Galería fotográfica del emprendimiento (logotipo, portada, punto de atención).

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador de la imagen. |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Emprendimiento propietario (`ON DELETE CASCADE`). |
| `url` | `TEXT` | `NOT NULL` | URL del archivo en el servicio de objetos. |
| `es_principal` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Define la fotografía de portada en listados y tarjetas de mapa. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de carga. |

* **Índices:** `idx_imagenes_emprendimiento (emprendimiento_id)` y el **índice parcial único** `uq_imagenes_emprendimiento_principal (emprendimiento_id) WHERE es_principal = TRUE` que garantiza a nivel de motor que un emprendimiento jamás tenga dos portadas activas a la vez.

---

#### Módulo 3: Geografía y Ubicaciones (Ecuador)

##### 10. `provincias`
Catálogo de las 24 provincias de la República del Ecuador.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único de la provincia. |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre oficial de la provincia. |

##### 11. `cantones`
Catálogo de cantones vinculados a su provincia correspondiente.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del cantón. |
| `provincia_id` | `UUID` | `FK -> provincias(id)`, `NOT NULL` | Provincia a la que pertenece (`ON DELETE RESTRICT`). |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | Nombre oficial del cantón. |

* **Restricciones únicas:** `uq_cantones_provincia_nombre (provincia_id, nombre)`.

##### 12. `parroquias`
Catálogo de parroquias urbanas y rurales pertenecientes a cada cantón.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único de la parroquia. |
| `canton_id` | `UUID` | `FK -> cantones(id)`, `NOT NULL` | Cantón al que pertenece (`ON DELETE RESTRICT`). |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | Nombre oficial de la parroquia. |
| `tipo` | `VARCHAR(20)` | `NOT NULL` | Clasificación territorial (`urbana` / `rural`). |

* **Restricciones únicas:** `uq_parroquias_canton_nombre (canton_id, nombre)` y `uq_parroquias_id_canton (id, canton_id)` (requerida para soportar la clave foránea compuesta desde `ubicaciones`).

##### 13. `ubicaciones`
Almacena los puntos públicos de venta, atención o retiro de cada emprendimiento. Permite gestionar múltiples sucursales y consultar proximidad mediante PostGIS.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único de la ubicación. |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Emprendimiento al que pertenece (`ON DELETE CASCADE`). |
| `canton_id` | `UUID` | `FK -> cantones(id)`, `NOT NULL` | Cantón obligatorio para filtros y analítica territorial (`ON DELETE RESTRICT`). |
| `parroquia_id` | `UUID` | `FK compuesta`, `NULL` | Parroquia opcional para reducir fricción al emprendedor. Si se informa, la FK compuesta `(parroquia_id, canton_id) -> parroquias(id, canton_id)` garantiza que pertenezca exactamente al cantón seleccionado. |
| `nombre_sucursal` | `VARCHAR(150)` | `NULL` | Etiqueta del punto (ej. *"Local Matriz"*, *"Punto de retiro Centro"*). |
| `direccion` | `TEXT` | `NOT NULL` | Dirección escrita del establecimiento o punto de retiro. |
| `referencia` | `TEXT` | `NULL` | Indicaciones complementarias para ubicar el lugar. |
| `horario_texto` | `VARCHAR(150)` | `NULL` | Horario referencial en texto libre (ej. *"Lun–Sáb 09:00 a 18:00"*). |
| `coordenadas` | `GEOGRAPHY(POINT, 4326)` | `NOT NULL` | Coordenada geodésica WGS84 (`longitud, latitud`) para cálculos exactos en metros. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Permite ocultar temporalmente una sucursal sin borrarla. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de registro. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_ubicaciones_actualizacion`. |

* **Índices:** `idx_ubicaciones_emprendimiento (emprendimiento_id)`, `idx_ubicaciones_canton (canton_id)`, `idx_ubicaciones_parroquia (parroquia_id)` y el **índice espacial** `idx_ubicaciones_coordenadas_gist USING GIST (coordenadas)`.

---

#### Módulo 4: Catálogo de Productos

##### 14. `categorias_producto`
Taxonomía específica para clasificar productos individuales independientemente de la categoría general del emprendimiento.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador de la categoría de producto. |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre visible (ej. *Mermeladas*, *Café Molido*, *Abonos Orgánicos*). |
| `descripcion` | `TEXT` | `NULL` | Descripción opcional. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Disponibilidad de la categoría. |

##### 15. `productos`
Representa cada artículo o bien comercializado por un emprendimiento.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único del producto. |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Tienda propietaria (`ON DELETE RESTRICT`). |
| `categoria_id` | `UUID` | `FK -> categorias_producto(id)`, `NOT NULL` | Categoría del producto (`ON DELETE RESTRICT`). |
| `nombre` | `VARCHAR(150)` | `NOT NULL` | Nombre comercial del producto. |
| `descripcion` | `TEXT` | `NULL` | Características, ingredientes, modo de uso o beneficios. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Estado de publicación del producto. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de creación. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_productos_actualizacion`. |

* **Índices:** `idx_productos_emprendimiento (emprendimiento_id)`, `idx_productos_categoria (categoria_id)`, `idx_productos_estado (estado)`.

##### 16. `presentaciones_producto`
Variantes, formatos o unidades de venta de un producto (ej. *Botella 500ml*, *Fundas 1kg*, *Unidad*). Todo ítem del carrito apunta a una presentación concreta.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador único de la presentación. |
| `producto_id` | `UUID` | `FK -> productos(id)`, `NOT NULL` | Producto padre (`ON DELETE CASCADE`). |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | Denominación de la variante o unidad de venta. |
| `descripcion` | `TEXT` | `NULL` | Detalle específico de esta presentación. |
| `precio` | `NUMERIC(12,2)` | `NULL` | Precio unitario en USD. Obligatorio ($\ge 0$) cuando `requiere_cotizacion = FALSE`; puede ser `NULL` si requiere cotización. |
| `requiere_cotizacion` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Marca si el precio se acuerda directamente con el emprendedor. |
| `estado` | `estado_registro` | `NOT NULL`, `DEFAULT 'activo'` | Disponibilidad para venta. |

* **Restricción `CHECK` (`chk_presentaciones_precio`):** Exige `(requiere_cotizacion = TRUE AND (precio IS NULL OR precio >= 0)) OR (requiere_cotizacion = FALSE AND precio IS NOT NULL AND precio >= 0)`.
* **Índices:** `idx_presentaciones_producto (producto_id)`.

##### 17. `imagenes_producto`
Fotografías asociadas a un producto.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador de la imagen. |
| `producto_id` | `UUID` | `FK -> productos(id)`, `NOT NULL` | Producto padre (`ON DELETE CASCADE`). |
| `url` | `TEXT` | `NOT NULL` | URL pública optimizada en el almacenamiento de objetos. |
| `es_principal` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Imagen destacada en tarjetas y carrito. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de carga. |

* **Índices:** `idx_imagenes_producto (producto_id)` y el **índice parcial único** `uq_imagenes_producto_principal (producto_id) WHERE es_principal = TRUE`.

---

#### Módulo 5: Pedidos y Detalles

##### 18. `pedidos`
Registra cada solicitud comercial individual dirigida a un único emprendimiento tras la división del carrito multivendedor.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador técnico del pedido. |
| `codigo_pedido` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE`, `DEFAULT` | Código secuencial legible generado automáticamente (`PED-000001`) usado en el mensaje de WhatsApp y pantallas de seguimiento. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Comprador autenticado (`ON DELETE RESTRICT`). |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Emprendimiento destinatario (`ON DELETE RESTRICT`). |
| `nombre_emprendimiento_snapshot` | `VARCHAR(150)` | `NOT NULL` | Fotografía histórica del nombre comercial al momento del pedido. |
| `whatsapp_emprendimiento_snapshot` | `VARCHAR(20)` | `NOT NULL` | Fotografía histórica del número de WhatsApp contactado. |
| `nota_comprador` | `TEXT` | `NULL` | Comentarios u observaciones del cliente incluidos en el pedido. |
| `total_referencial` | `NUMERIC(12,2)` | `NULL`, `CHECK (>= 0)` | Suma referencial de los ítems con precio fijo (no constituye un cobro en app). |
| `estado` | `estado_pedido` | `NOT NULL`, `DEFAULT 'nuevo'` | Estado vigente (`nuevo`, `confirmado`, `preparando`, `entregado`, `cancelado`). |
| `comprador_confirmo_recepcion` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Indica si el comprador confirmó haber recibido satisfactoriamente el pedido. |
| `fecha_confirmacion_comprador` | `TIMESTAMPTZ` | `NULL` | Fecha en que el comprador marcó la confirmación. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de generación del pedido. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_pedidos_actualizacion`. |

* **Restricciones:** `uq_pedidos_integridad_resena UNIQUE (id, usuario_id, emprendimiento_id)` (habilita la FK compuesta de `resenas`) y `chk_pedidos_confirmacion_coherente` que impide que un pedido `cancelado` tenga `comprador_confirmo_recepcion = TRUE`.
* **Índices:** `idx_pedidos_usuario (usuario_id)`, `idx_pedidos_emprendimiento (emprendimiento_id)`, `idx_pedidos_estado (estado)`, `idx_pedidos_fecha_creacion (fecha_creacion DESC)`.

##### 19. `detalles_pedido`
Líneas de producto que conforman un pedido, preservando inmutablemente precios y nombres históricos.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador de la línea de detalle. |
| `pedido_id` | `UUID` | `FK -> pedidos(id)`, `NOT NULL` | Pedido padre (`ON DELETE CASCADE`). |
| `presentacion_id` | `UUID` | `FK -> presentaciones_producto(id)`, `NULL` | Referencia a la presentación original (`ON DELETE SET NULL` para conservar el historial aunque el catálogo se depure). |
| `nombre_producto` | `VARCHAR(150)` | `NOT NULL` | Snapshot del nombre del producto. |
| `nombre_presentacion` | `VARCHAR(100)` | `NOT NULL` | Snapshot del nombre de la presentación. |
| `requiere_cotizacion` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Snapshot del indicador de cotización. |
| `precio_unitario` | `NUMERIC(12,2)` | `NULL` | Snapshot del precio unitario al momento del pedido (permite `NULL` solo si `requiere_cotizacion = TRUE`). |
| `cantidad` | `INTEGER` | `NOT NULL`, `CHECK (cantidad > 0)` | Unidades solicitadas. |

* **Restricción `CHECK` (`chk_detalles_precio`):** Misma coherencia precio/cotización que `presentaciones_producto`.
* **Índices:** `idx_detalles_pedido_pedido (pedido_id)`, `idx_detalles_pedido_presentacion (presentacion_id)`.

---

#### Módulo 6: Confianza, Reseñas, Favoritos y Moderación

##### 20. `resenas`
Valoraciones y comentarios públicos dejados por compradores sobre su experiencia real con un emprendimiento.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador de la reseña. |
| `pedido_id` | `UUID` | `FK compuesta`, `NOT NULL`, `UNIQUE` | Pedido real que habilita la reseña (máximo 1 reseña por pedido). |
| `usuario_id` | `UUID` | `FK compuesta`, `NOT NULL` | Comprador autor de la reseña. |
| `emprendimiento_id` | `UUID` | `FK compuesta`, `NOT NULL` | Emprendimiento evaluado. |
| `valoracion` | `INTEGER` | `NOT NULL`, `CHECK (BETWEEN 1 AND 5)` | Puntuación numérica de 1 a 5 estrellas. |
| `comentario` | `TEXT` | `NULL` | Opinión textual opcional del comprador. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de publicación. |
| `fecha_actualizacion` | `TIMESTAMPTZ` | `NULL` | Actualizado automáticamente vía trigger `trg_resenas_actualizacion`. |

* **Integridad reforzada:** La clave foránea compuesta `fk_resenas_pedido_exacto (pedido_id, usuario_id, emprendimiento_id) -> pedidos (id, usuario_id, emprendimiento_id)` impide a nivel de base de datos crear reseñas falsas o cruzadas hacia emprendimientos donde el usuario no compró.
* **Índices:** `idx_resenas_emprendimiento (emprendimiento_id)`, `idx_resenas_usuario (usuario_id)`.

##### 21. `emprendimientos_favoritos`
Tabla asociativa de tiendas guardadas por cada usuario.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del favorito. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Usuario propietario (`ON DELETE CASCADE`). |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Tienda guardada (`ON DELETE CASCADE`). |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha en que se guardó. |

* **Restricciones únicas:** `uq_favoritos_usuario_emprendimiento (usuario_id, emprendimiento_id)`.

##### 22. `productos_favoritos`
Tabla asociativa de productos guardados por cada usuario.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del favorito. |
| `usuario_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Usuario propietario (`ON DELETE CASCADE`). |
| `producto_id` | `UUID` | `FK -> productos(id)`, `NOT NULL` | Producto guardado (`ON DELETE CASCADE`). |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha en que se guardó. |

* **Restricciones únicas:** `uq_favoritos_usuario_producto (usuario_id, producto_id)`.

##### 23. `reportes`
Bandeja de denuncias ciudadanas por posibles estafas, incumplimientos o información engañosa. Sustituye la revisión previa manual por un control reactivo auditable.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del reporte. |
| `reportado_por` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Usuario que envía el reporte (`ON DELETE RESTRICT`). |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Emprendimiento denunciado (`ON DELETE RESTRICT`). |
| `pedido_id` | `UUID` | `FK -> pedidos(id)`, `NULL` | Pedido asociado al incidente, si aplica (`ON DELETE SET NULL`). |
| `motivo` | `motivo_reporte` | `NOT NULL` | Categoría tipificada de la denuncia. |
| `descripcion` | `TEXT` | `NOT NULL` | Relato detallado de los hechos. |
| `estado` | `estado_reporte` | `NOT NULL`, `DEFAULT 'pendiente'` | Estado de atención por parte de los administradores. |
| `resuelto_por` | `UUID` | `FK -> usuarios(id)`, `NULL` | Administrador que gestionó el caso (`ON DELETE SET NULL`). |
| `resolucion` | `TEXT` | `NULL` | Notas administrativas sobre el cierre del reporte. |
| `fecha_creacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha de recepción de la denuncia. |
| `fecha_resolucion` | `TIMESTAMPTZ` | `NULL` | Fecha de cierre o descarte. |

* **Índices:** `idx_reportes_emprendimiento (emprendimiento_id)`, `idx_reportes_estado (estado)`, `idx_reportes_usuario (reportado_por)`.

##### 24. `moderaciones_emprendimiento`
Bitácora inmutable de acciones disciplinarias o correctivas ejecutadas por administradores sobre un emprendimiento.

| Atributo | Tipo de Dato | Restricciones | Descripción y Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | Identificador del evento de moderación. |
| `emprendimiento_id` | `UUID` | `FK -> emprendimientos(id)`, `NOT NULL` | Tienda moderada (`ON DELETE RESTRICT`). |
| `administrador_id` | `UUID` | `FK -> usuarios(id)`, `NOT NULL` | Administrador responsable (`ON DELETE RESTRICT`). |
| `reporte_id` | `UUID` | `FK -> reportes(id)`, `NULL` | Reporte ciudadano que originó la medida, si aplica (`ON DELETE SET NULL`). |
| `accion` | `accion_moderacion` | `NOT NULL` | Medida aplicada (`advertencia`, `suspension`, `reactivacion`). |
| `motivo` | `TEXT` | `NOT NULL` | Justificación obligatoria de la decisión administrativa. |
| `fecha_moderacion` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Fecha exacta de aplicación. |

* **Índices:** `idx_moderaciones_emprendimiento (emprendimiento_id)`, `idx_moderaciones_administrador (administrador_id)`.

---

### 8.3. Matriz de Relaciones y Políticas de Integridad Referencial

Las políticas `ON DELETE` fueron diseñadas explícitamente para equilibrar limpieza automática en entidades dependientes y preservación estricta de registros legales, comerciales y de moderación:

| Entidad Padre | Entidad Hija | Cardinalidad | Política `ON DELETE` | Justificación Técnica |
| :--- | :--- | :---: | :---: | :--- |
| `roles` | `usuarios` | `1 : N` | `RESTRICT` | Impide eliminar roles que tienen usuarios asignados. |
| `usuarios` | `codigos_verificacion` | `1 : N` | `CASCADE` | Códigos efímeros sin valor histórico independiente. |
| `usuarios` | `aceptaciones_documentos` | `1 : N` | `RESTRICT` | Preserva evidencia legal exigida por la LOPDP. |
| `documentos_legales` | `aceptaciones_documentos` | `1 : N` | `RESTRICT` | Impide borrar versiones de documentos ya aceptadas. |
| `usuarios` | `emprendimientos` | `1 : 1` | `RESTRICT` | Regla de titularidad única y protección de historial comercial. |
| `categorias_emprendimiento` | `emprendimientos` | `1 : N` | `RESTRICT` | Usar borrado lógico (`inactivo`) si existen tiendas asociadas. |
| `emprendimientos` | `redes_sociales_emprendimiento` | `1 : N` | `CASCADE` | Atributos puramente dependientes del perfil comercial. |
| `emprendimientos` | `imagenes_emprendimiento` | `1 : N` | `CASCADE` | Metadatos multimedia dependientes del emprendimiento. |
| `provincias` | `cantones` | `1 : N` | `RESTRICT` | Protege la integridad del catálogo territorial oficial. |
| `cantones` | `parroquias` | `1 : N` | `RESTRICT` | Protege la jerarquía territorial oficial. |
| `emprendimientos` | `ubicaciones` | `1 : N` | `CASCADE` | Ubicaciones dependientes de la existencia de la tienda. |
| `cantones` / `parroquias` | `ubicaciones` | `1 : N` | `RESTRICT` | Impide dejar ubicaciones huérfanas de división territorial. |
| `emprendimientos` | `productos` | `1 : N` | `RESTRICT` | Protege catálogos existentes; emplear estado `inactivo`. |
| `categorias_producto` | `productos` | `1 : N` | `RESTRICT` | Evita productos sin clasificación. |
| `productos` | `presentaciones_producto` | `1 : N` | `CASCADE` | Las variantes no existen sin su producto padre. |
| `productos` | `imagenes_producto` | `1 : N` | `CASCADE` | Metadatos multimedia dependientes del producto. |
| `usuarios` / `emprendimientos` | `pedidos` | `1 : N` | `RESTRICT` | El historial comercial nunca se elimina físicamente. |
| `pedidos` | `detalles_pedido` | `1 : N` | `CASCADE` | Las líneas pertenecen indivisiblemente a su cabecera de pedido. |
| `presentaciones_producto` | `detalles_pedido` | `1 : N` | `SET NULL` | Si se purga una presentación, el detalle conserva sus campos *snapshot*. |
| `pedidos` *(compuesta)* | `resenas` | `1 : 0..1` | `RESTRICT` | Garantiza trazabilidad de calificaciones verificadas. |
| `usuarios` / `emprendimientos` | `emprendimientos_favoritos` | `1 : N` | `CASCADE` | Marcadores personales sin impacto financiero/auditable. |
| `usuarios` / `productos` | `productos_favoritos` | `1 : N` | `CASCADE` | Marcadores personales sin impacto financiero/auditable. |
| `usuarios` / `emprendimientos` | `reportes` | `1 : N` | `RESTRICT` | Conserva evidencia de denuncias por posibles estafas. |
| `pedidos` | `reportes` | `1 : N` | `SET NULL` | Referencia opcional a pedido en disputa. |
| `usuarios` *(admin)* | `reportes` | `1 : N` | `SET NULL` | Permite preservar el reporte incluso si cambia la cuenta admin. |
| `emprendimientos` / `usuarios` | `moderaciones_emprendimiento` | `1 : N` | `RESTRICT` | Bitácora disciplinaria inmutable. |
| `reportes` | `moderaciones_emprendimiento` | `1 : N` | `SET NULL` | Vínculo opcional entre denuncia y acción correctiva. |

### 8.4. Automatizaciones y Datos Semilla

1. **Secuencia `seq_codigo_pedido`:** Genera automáticamente identificadores legibles (`PED-000001`, `PED-000002`, ...) como valor por defecto en `pedidos.codigo_pedido`, evitando exponer UUIDs en los mensajes de WhatsApp.
2. **Triggers de auditoría (`fn_actualizar_fecha_modificacion`):** Aplicados en `BEFORE UPDATE` sobre `usuarios`, `emprendimientos`, `ubicaciones`, `productos`, `pedidos` y `resenas` para actualizar automáticamente `fecha_actualizacion = NOW()`.
3. **Datos semilla obligatorios para puesta en marcha:**
   * Tabla `roles`: `consumidor`, `emprendedor`, `administrador`.
   * Tablas `provincias`, `cantones`, `parroquias`: Carga inicial oficial de la División Político-Administrativa (DPA) del INEC Ecuador.
   * Tabla `documentos_legales`: Versión `1.0` de Términos de Uso y Política de Privacidad.
   * Cuenta inicial de `administrador` creada por script de *seed* seguro (nunca expuesta en registro público).

---

## 9. Hoja de Ruta de Implementación y Guía de Continuidad (Handover)

### 9.1. Plan de desarrollo por fases

| Fase | Entregables Clave | Criterio de Terminación (Definition of Done) |
| :--- | :--- | :--- |
| **Fase 1: Cimientos y Acceso** | Setup de NestJS, PostgreSQL + PostGIS, migración inicial del DDL, *seeds* DPA Ecuador/roles, flujo OTP WhatsApp, aceptación legal y CRUD de perfil. | Un usuario puede registrarse y autenticarse con su teléfono verificado; un admin puede autenticarse con contraseña; el *rate limiting* protege los endpoints OTP. |
| **Fase 2: Emprendimientos y Catálogo** | Alta inmediata de emprendimiento (1:1), gestión de redes/imágenes (S3), gestión de ubicaciones con validación geográfica en Ecuador, CRUD de productos/presentaciones y endpoints públicos de exploración/búsqueda. | Un emprendedor publica su tienda y productos con precios y opciones a cotizar; un visitante anónimo explora, busca y filtra el catálogo sin iniciar sesión. |
| **Fase 3: Mapa y Geoproximidad** | Mapa interactivo con clustering, vista lista/mapa, consultas PostGIS por cercanía/radio, tarjeta resumida y navegación externa hacia Google Maps/Waze. | Usuarios con GPS ven distancias reales en km/m; usuarios sin GPS navegan el mapa y filtran por provincia/cantón sin errores. |
| **Fase 4: Carrito y Pedidos WhatsApp** | Carrito local multivendedor, validación transaccional de stock/estado, división automática de pedidos con *snapshot*, aviso anti-estafas, deep link `wa.me`, gestión de estados y confirmación de recepción. | Un carrito con productos de 3 tiendas genera 3 códigos `PED-XXXXXX` independientes con sus enlaces de WhatsApp; cambiar el precio luego no altera el pedido histórico. |
| **Fase 5: Confianza y Panel Admin** | Favoritos, reseñas verificadas ligadas a `pedido_id`, sistema de reportes, panel web de Innova (categorías, bandeja de reportes, suspensión/reactivación y estadísticas agregadas). | Un consumidor reporta una tienda; el admin la suspende con motivo registrado y desaparece inmediatamente de búsquedas y mapa. |
| **Fase 6: Evolución Futura (Post-MVP)** | Cálculo automático de rangos/insignias basado en pedidos entregados + reseñas, notificaciones push (FCM) de cambio de estado de pedido, estadísticas propias para emprendedores y módulo de ferias. | Evaluar e implementar únicamente tras validar adopción real con usuarios en producción. |

### 9.2. Notas críticas para el próximo desarrollador
* **Integración económica de WhatsApp OTP:** Si el presupuesto inicial no cubre el costo por plantilla de autenticación de Meta WhatsApp Cloud API, implementar la **verificación inversa**: el backend genera un token corto de un solo uso y abre `wa.me/<numero_oficial>?text=Verificar:<codigo>`; el webhook recibe el mensaje del usuario (conversación de servicio gratuita en Meta), valida que el número remitente coincida con el token y activa la sesión.
* **Integridad de PostGIS en el ORM:** Si se utiliza Prisma, declarar `coordenadas` como `Unsupported("geography(Point, 4326)")` y encapsular las inserciones (`ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`) y consultas de proximidad (`ST_DWithin`, `ST_Distance`) en un repositorio geográfico dedicado con consultas parametrizadas.
* **Validación de máquina de estados de pedidos:** Implementar explícitamente en el servicio de pedidos un mapa de transiciones permitidas (`TRANSICIONES_VALIDAS`) y bloquear cualquier intento de pasar un pedido `entregado` o `cancelado` a otro estado.
* **Limpieza periódica:** Configurar una tarea programada (*cron job*) semanal para purgar registros expirados de `codigos_verificacion` mayores a 30 días y mantener ágil la tabla.