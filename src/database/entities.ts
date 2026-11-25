import { EmprendimientoFavorito } from '../confianza/entities/emprendimiento-favorito.entity.js';
import { ModeracionEmprendimiento } from '../confianza/entities/moderacion-emprendimiento.entity.js';
import { ProductoFavorito } from '../confianza/entities/producto-favorito.entity.js';
import { Reporte } from '../confianza/entities/reporte.entity.js';
import { Resena } from '../confianza/entities/resena.entity.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { Emprendimiento } from '../emprendimientos/entities/emprendimiento.entity.js';
import { ImagenEmprendimiento } from '../emprendimientos/entities/imagen-emprendimiento.entity.js';
import { RedSocialEmprendimiento } from '../emprendimientos/entities/red-social-emprendimiento.entity.js';
import { Canton } from '../geografia/entities/canton.entity.js';
import { Parroquia } from '../geografia/entities/parroquia.entity.js';
import { Provincia } from '../geografia/entities/provincia.entity.js';
import { Ubicacion } from '../geografia/entities/ubicacion.entity.js';
import { DetallePedido } from '../pedidos/entities/detalle-pedido.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { ImagenProducto } from '../productos/entities/imagen-producto.entity.js';
import { PresentacionProducto } from '../productos/entities/presentacion-producto.entity.js';
import { Producto } from '../productos/entities/producto.entity.js';
import { AceptacionDocumento } from '../usuarios/entities/aceptacion-documento.entity.js';
import { CodigoVerificacion } from '../usuarios/entities/codigo-verificacion.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';

export const ALL_ENTITIES = [
  Rol,
  Usuario,
  CodigoVerificacion,
  DocumentoLegal,
  AceptacionDocumento,
  CategoriaEmprendimiento,
  Emprendimiento,
  RedSocialEmprendimiento,
  ImagenEmprendimiento,
  Provincia,
  Canton,
  Parroquia,
  Ubicacion,
  CategoriaProducto,
  Producto,
  PresentacionProducto,
  ImagenProducto,
  Pedido,
  DetallePedido,
  Resena,
  EmprendimientoFavorito,
  ProductoFavorito,
  Reporte,
  ModeracionEmprendimiento,
];
