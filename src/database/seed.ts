import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { EstadoRegistro } from '../common/enums/index.js';
import { CategoriaEmprendimiento } from '../emprendimientos/entities/categoria-emprendimiento.entity.js';
import { Canton } from '../geografia/entities/canton.entity.js';
import { Parroquia } from '../geografia/entities/parroquia.entity.js';
import { Provincia } from '../geografia/entities/provincia.entity.js';
import { CategoriaProducto } from '../productos/entities/categoria-producto.entity.js';
import { DocumentoLegal } from '../usuarios/entities/documento-legal.entity.js';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { ALL_ENTITIES } from './entities.js';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

interface ParroquiaSeed {
  nombre: string;
  tipo: 'urbana' | 'rural';
}

interface CantonSeed {
  nombre: string;
  parroquias: ParroquiaSeed[];
}

interface ProvinciaSeed {
  nombre: string;
  cantones: CantonSeed[];
}

const ROLES_SEED = [
  {
    nombre: 'consumidor',
    descripcion:
      'Usuario general que explora emprendimientos, gestiona favoritos, realiza pedidos y publica reseñas.',
  },
  {
    nombre: 'emprendedor',
    descripcion:
      'Propietario de un emprendimiento que administra su tienda, ubicaciones, catálogo y pedidos.',
  },
  {
    nombre: 'administrador',
    descripcion:
      'Operador autorizado para moderar reportes, suspender tiendas, gestionar categorías y consultar estadísticas.',
  },
];

const DOCUMENTOS_LEGALES_SEED = [
  {
    nombre: 'Términos y Condiciones de Uso',
    tipo: 'terminos',
    version: '1.0',
    contenidoUrl: 'https://plataformamapeo.ec/legal/terminos-v1.0',
    estado: EstadoRegistro.ACTIVO,
    fechaPublicacion: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    nombre: 'Política de Privacidad y Protección de Datos Personales',
    tipo: 'privacidad',
    version: '1.0',
    contenidoUrl: 'https://plataformamapeo.ec/legal/privacidad-v1.0',
    estado: EstadoRegistro.ACTIVO,
    fechaPublicacion: new Date('2026-01-01T00:00:00.000Z'),
  },
];

const CATEGORIAS_EMPRENDIMIENTO_SEED = [
  {
    nombre: 'Gastronomía y Comida Típica',
    descripcion: 'Restaurantes, huecas, comida manabita, sierra y platos tradicionales.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Repostería, Panadería y Cafetería',
    descripcion: 'Pan artesanal, tortas, bocaditos, café de especialidad y chocolatería.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Artesanías y Manualidades',
    descripcion: 'Tejidos en paja toquilla, tagua, cerámica, madera y arte popular.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Moda, Calzado y Confección',
    descripcion: 'Ropa de diseño local, textiles, calzado artesanal y marroquinería.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Agricultura y Productos Orgánicos',
    descripcion: 'Productores locales de frutas, hortalizas, miel, lácteos y granos.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Belleza y Cuidado Personal',
    descripcion: 'Cosmética natural, jabones artesanales, estética y bienestar.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Hogar y Decoración',
    descripcion: 'Muebles, velas aromáticas, plantas ornamentales y artículos para el hogar.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Tecnología y Servicios Digitales',
    descripcion: 'Soporte técnico, diseño gráfico, desarrollo y servicios profesionales.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Salud, Deporte y Bienestar',
    descripcion: 'Suplementos naturales, entrenamiento, terapias y productos saludables.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Turismo y Experiencias Locales',
    descripcion: 'Operadores comunitarios, agroturismo, guianza y hospedaje local.',
    estado: EstadoRegistro.ACTIVO,
  },
];

const CATEGORIAS_PRODUCTO_SEED = [
  {
    nombre: 'Alimentos Preparados',
    descripcion: 'Platos listos para consumir, almuerzos, piqueos y comida rápida artesanal.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Dulces, Postres y Panadería',
    descripcion: 'Tortas, galletas, rompope, dulces tradicionales y pan recién horneado.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Café, Cacao y Bebidas',
    descripcion: 'Café molido o en grano, chocolate fino de aroma, jugos y bebidas naturales.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Frutas, Verduras y Despensa',
    descripcion: 'Productos agrícolas frescos, conservas, salsas, miel y lácteos.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Artesanías en Paja Toquilla y Tagua',
    descripcion: 'Sombreros, bolsos, joyería y adornos elaborados a mano.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Ropa y Accesorios',
    descripcion: 'Prendas de vestir, camisetas, bordados, bisutería y complementos.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Calzado y Marroquinería',
    descripcion: 'Zapatos, sandalias, carteras, billeteras y cinturones de cuero o textil.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Cosmética Natural e Higiene',
    descripcion: 'Jabones, aceites esenciales, cremas y productos de cuidado personal.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Artículos para el Hogar y Plantas',
    descripcion: 'Decoración, velas, cerámica utilitaria, macetas y plantas.',
    estado: EstadoRegistro.ACTIVO,
  },
  {
    nombre: 'Servicios y Pedidos Personalizados',
    descripcion: 'Servicios bajo cotización, arreglos, diseño e impresiones personalizadas.',
    estado: EstadoRegistro.ACTIVO,
  },
];

const GEOGRAFIA_ECUADOR_SEED: ProvinciaSeed[] = [
  {
    nombre: 'Manabí',
    cantones: [
      {
        nombre: 'Portoviejo',
        parroquias: [
          { nombre: 'Portoviejo', tipo: 'urbana' },
          { nombre: '12 de Marzo', tipo: 'urbana' },
          { nombre: 'Colón', tipo: 'urbana' },
          { nombre: 'Picoazá', tipo: 'urbana' },
          { nombre: 'San Pablo', tipo: 'urbana' },
          { nombre: 'Andrés de Vera', tipo: 'urbana' },
          { nombre: 'Francisco Pacheco', tipo: 'urbana' },
          { nombre: '18 de Octubre', tipo: 'urbana' },
          { nombre: 'Simón Bolívar', tipo: 'urbana' },
          { nombre: 'Abdón Calderón', tipo: 'rural' },
          { nombre: 'Alhajuela', tipo: 'rural' },
          { nombre: 'Chirijos', tipo: 'rural' },
          { nombre: 'Crucita', tipo: 'rural' },
          { nombre: 'Pueblo Nuevo', tipo: 'rural' },
          { nombre: 'Río Chico', tipo: 'rural' },
          { nombre: 'San Plácido', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Manta',
        parroquias: [
          { nombre: 'Manta', tipo: 'urbana' },
          { nombre: 'Tarqui', tipo: 'urbana' },
          { nombre: 'Eloy Alfaro', tipo: 'urbana' },
          { nombre: 'Los Esteros', tipo: 'urbana' },
          { nombre: 'San Mateo', tipo: 'urbana' },
          { nombre: 'San Lorenzo', tipo: 'rural' },
          { nombre: 'Santa Marianita', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Montecristi',
        parroquias: [
          { nombre: 'Montecristi', tipo: 'urbana' },
          { nombre: 'Aníbal San Andrés', tipo: 'urbana' },
          { nombre: 'Colorado', tipo: 'urbana' },
          { nombre: 'La Pila', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Chone',
        parroquias: [
          { nombre: 'Chone', tipo: 'urbana' },
          { nombre: 'Santa Rita', tipo: 'urbana' },
          { nombre: 'Canuto', tipo: 'rural' },
          { nombre: 'Ricaurte', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Jipijapa',
        parroquias: [
          { nombre: 'San Lorenzo de Jipijapa', tipo: 'urbana' },
          { nombre: 'Manuel Inocencio Parrales y Guale', tipo: 'urbana' },
          { nombre: 'Puerto Cayo', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Sucre',
        parroquias: [
          { nombre: 'Bahía de Caráquez', tipo: 'urbana' },
          { nombre: 'Leonidas Plaza Gutiérrez', tipo: 'urbana' },
          { nombre: 'Charapotó', tipo: 'rural' },
          { nombre: 'San Isidro', tipo: 'rural' },
        ],
      },
      {
        nombre: 'El Carmen',
        parroquias: [
          { nombre: 'El Carmen', tipo: 'urbana' },
          { nombre: '4 de Diciembre', tipo: 'urbana' },
          { nombre: 'Wilfrido Loor Moreira', tipo: 'rural' },
        ],
      },
    ],
  },
  {
    nombre: 'Pichincha',
    cantones: [
      {
        nombre: 'Quito',
        parroquias: [
          { nombre: 'Centro Histórico', tipo: 'urbana' },
          { nombre: 'Iñaquito', tipo: 'urbana' },
          { nombre: 'Mariscal Sucre', tipo: 'urbana' },
          { nombre: 'Carcelén', tipo: 'urbana' },
          { nombre: 'Chillogallo', tipo: 'urbana' },
          { nombre: 'Cumbayá', tipo: 'rural' },
          { nombre: 'Tumbaco', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Rumiñahui',
        parroquias: [
          { nombre: 'Sangolquí', tipo: 'urbana' },
          { nombre: 'San Rafael', tipo: 'urbana' },
        ],
      },
      {
        nombre: 'Mejía',
        parroquias: [
          { nombre: 'Machachi', tipo: 'urbana' },
          { nombre: 'Alóag', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Cayambe',
        parroquias: [
          { nombre: 'Cayambe', tipo: 'urbana' },
          { nombre: 'Ayora', tipo: 'urbana' },
        ],
      },
    ],
  },
  {
    nombre: 'Guayas',
    cantones: [
      {
        nombre: 'Guayaquil',
        parroquias: [
          { nombre: 'Tarqui', tipo: 'urbana' },
          { nombre: 'Ximena', tipo: 'urbana' },
          { nombre: 'Febres Cordero', tipo: 'urbana' },
          { nombre: 'Carbo', tipo: 'urbana' },
          { nombre: 'Posorja', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Samborondón',
        parroquias: [
          { nombre: 'Samborondón', tipo: 'urbana' },
          { nombre: 'La Puntilla', tipo: 'urbana' },
          { nombre: 'Tarifa', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Daule',
        parroquias: [
          { nombre: 'Daule', tipo: 'urbana' },
          { nombre: 'La Aurora', tipo: 'urbana' },
        ],
      },
      {
        nombre: 'Durán',
        parroquias: [{ nombre: 'Eloy Alfaro (Durán)', tipo: 'urbana' }],
      },
      {
        nombre: 'Milagro',
        parroquias: [{ nombre: 'Milagro', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Azuay',
    cantones: [
      {
        nombre: 'Cuenca',
        parroquias: [
          { nombre: 'El Sagrario', tipo: 'urbana' },
          { nombre: 'San Sebastián', tipo: 'urbana' },
          { nombre: 'Yanuncay', tipo: 'urbana' },
          { nombre: 'Baños', tipo: 'rural' },
          { nombre: 'Ricaurte', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Gualaceo',
        parroquias: [{ nombre: 'Gualaceo', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Tungurahua',
    cantones: [
      {
        nombre: 'Ambato',
        parroquias: [
          { nombre: 'La Matriz', tipo: 'urbana' },
          { nombre: 'Atocha - Ficoa', tipo: 'urbana' },
          { nombre: 'Huachi Loreto', tipo: 'urbana' },
          { nombre: 'Izamba', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Baños de Agua Santa',
        parroquias: [{ nombre: 'Baños de Agua Santa', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Loja',
    cantones: [
      {
        nombre: 'Loja',
        parroquias: [
          { nombre: 'El Sagrario', tipo: 'urbana' },
          { nombre: 'San Sebastián', tipo: 'urbana' },
          { nombre: 'Sucre', tipo: 'urbana' },
          { nombre: 'Vilcabamba', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Catamayo',
        parroquias: [{ nombre: 'Catamayo', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'El Oro',
    cantones: [
      {
        nombre: 'Machala',
        parroquias: [
          { nombre: 'Machala', tipo: 'urbana' },
          { nombre: 'Puerto Bolívar', tipo: 'urbana' },
        ],
      },
      {
        nombre: 'Pasaje',
        parroquias: [{ nombre: 'Pasaje', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Santa Elena',
    cantones: [
      {
        nombre: 'Santa Elena',
        parroquias: [
          { nombre: 'Santa Elena', tipo: 'urbana' },
          { nombre: 'Manglaralto', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Salinas',
        parroquias: [{ nombre: 'Salinas', tipo: 'urbana' }],
      },
      {
        nombre: 'La Libertad',
        parroquias: [{ nombre: 'La Libertad', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Imbabura',
    cantones: [
      {
        nombre: 'Ibarra',
        parroquias: [
          { nombre: 'El Sagrario', tipo: 'urbana' },
          { nombre: 'San Antonio', tipo: 'rural' },
        ],
      },
      {
        nombre: 'Otavalo',
        parroquias: [{ nombre: 'Otavalo', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Santo Domingo de los Tsáchilas',
    cantones: [
      {
        nombre: 'Santo Domingo',
        parroquias: [
          { nombre: 'Santo Domingo de los Colorados', tipo: 'urbana' },
          { nombre: 'Bombolí', tipo: 'urbana' },
        ],
      },
    ],
  },
  {
    nombre: 'Los Ríos',
    cantones: [
      {
        nombre: 'Babahoyo',
        parroquias: [{ nombre: 'Babahoyo', tipo: 'urbana' }],
      },
      {
        nombre: 'Quevedo',
        parroquias: [{ nombre: 'Quevedo', tipo: 'urbana' }],
      },
    ],
  },
  {
    nombre: 'Esmeraldas',
    cantones: [
      {
        nombre: 'Esmeraldas',
        parroquias: [{ nombre: 'Esmeraldas', tipo: 'urbana' }],
      },
      {
        nombre: 'Atacames',
        parroquias: [
          { nombre: 'Atacames', tipo: 'urbana' },
          { nombre: 'Tonsupa', tipo: 'rural' },
        ],
      },
    ],
  },
  {
    nombre: 'Chimborazo',
    cantones: [
      {
        nombre: 'Riobamba',
        parroquias: [
          { nombre: 'Lizarzaburu', tipo: 'urbana' },
          { nombre: 'Maldonado', tipo: 'urbana' },
        ],
      },
    ],
  },
];

async function runSeed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '2003',
    database: process.env.DB_NAME ?? 'mapeo_emprendimientos',
    entities: ALL_ENTITIES,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Rol)
        .values(ROLES_SEED)
        .orIgnore()
        .execute();

      await manager
        .createQueryBuilder()
        .insert()
        .into(DocumentoLegal)
        .values(DOCUMENTOS_LEGALES_SEED)
        .orIgnore()
        .execute();

      await manager
        .createQueryBuilder()
        .insert()
        .into(CategoriaEmprendimiento)
        .values(CATEGORIAS_EMPRENDIMIENTO_SEED)
        .orIgnore()
        .execute();

      await manager
        .createQueryBuilder()
        .insert()
        .into(CategoriaProducto)
        .values(CATEGORIAS_PRODUCTO_SEED)
        .orIgnore()
        .execute();

      const provinciaRepo = manager.getRepository(Provincia);
      const cantonRepo = manager.getRepository(Canton);

      for (const provinciaData of GEOGRAFIA_ECUADOR_SEED) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(Provincia)
          .values({ nombre: provinciaData.nombre })
          .orIgnore()
          .execute();

        const provincia = await provinciaRepo.findOneByOrFail({ nombre: provinciaData.nombre });

        for (const cantonData of provinciaData.cantones) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(Canton)
            .values({ provinciaId: provincia.id, nombre: cantonData.nombre })
            .orIgnore()
            .execute();

          const canton = await cantonRepo.findOneByOrFail({
            provinciaId: provincia.id,
            nombre: cantonData.nombre,
          });

          if (cantonData.parroquias.length > 0) {
            await manager
              .createQueryBuilder()
              .insert()
              .into(Parroquia)
              .values(
                cantonData.parroquias.map((parroquia) => ({
                  cantonId: canton.id,
                  nombre: parroquia.nombre,
                  tipo: parroquia.tipo,
                })),
              )
              .orIgnore()
              .execute();
          }
        }
      }
    });

    console.log('Seed completado exitosamente (idempotente).');
  } finally {
    await dataSource.destroy();
  }
}

runSeed().catch((error: unknown) => {
  console.error('Error al ejecutar el seed:', error);
  process.exit(1);
});
