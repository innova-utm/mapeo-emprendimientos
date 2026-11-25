export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

export enum CanalVerificacion {
  WHATSAPP = 'whatsapp',
  CORREO = 'correo',
}

export enum PropositoVerificacion {
  REGISTRO = 'registro',
  LOGIN = 'login',
  CAMBIO_TELEFONO = 'cambio_telefono',
  RECUPERACION = 'recuperacion',
}

export enum EstadoRegistro {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export enum EstadoEmprendimiento {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

export enum EstadoPedido {
  NUEVO = 'nuevo',
  CONFIRMADO = 'confirmado',
  PREPARANDO = 'preparando',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

export enum MotivoReporte {
  POSIBLE_ESTAFA = 'posible_estafa',
  PRODUCTO_ENGANOSO = 'producto_enganoso',
  INCUMPLIMIENTO_PEDIDO = 'incumplimiento_pedido',
  UBICACION_FALSA = 'ubicacion_falsa',
  CONTENIDO_INAPROPIADO = 'contenido_inapropiado',
  OTRO = 'otro',
}

export enum EstadoReporte {
  PENDIENTE = 'pendiente',
  EN_REVISION = 'en_revision',
  RESUELTO = 'resuelto',
  DESCARTADO = 'descartado',
}

export enum AccionModeracion {
  ADVERTENCIA = 'advertencia',
  SUSPENSION = 'suspension',
  REACTIVACION = 'reactivacion',
}
