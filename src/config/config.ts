import "@std/dotenv/load";

/**
 * Define las opciones para la configuración de imágenes AVIF.
 */
interface AvifOptions {
  /** Calidad de la imagen (valor numérico). */
  QUALITY: number;
  /** Nivel de esfuerzo en la compresión. */
  EFFORT: number;
  /** Indica si la compresión es sin pérdida (true para lossless, false en caso contrario). */
  LOSSLESS: boolean;
  /** Especifica el muestreo de crominancia: "4:2:0" o "4:4:4". */
  CHROMA: "4:2:0" | "4:4:4";
}

/**
 * Configuración central de la aplicación.
 *
 * Incluye datos de entorno, parámetros de conexión, claves, permisos, límites y configuraciones de imagen.
 */
interface SetupConfig {
  /** Indica el entorno activo (development, production, etc.). */
  readonly ENV: string;
  /** Número de puerto donde correrá la app. */
  readonly PORT: number;
  /** Cadena de conexión a MongoDB. */
  readonly MONGO: string;
  /** Agrupación de secretos y algoritmos de cifrado. */
  readonly KEY: {
    /** Clave secreta para autenticación. */
    readonly SECRET: string;
    /** Algoritmo de cifrado para firmar tokens. */
    readonly ALG: Algorithm;
    /** Valor absoluto para propósitos específicos de cifrado o hashing. */
    readonly ABSOLUTE: string;
  };
  /** Mapeo de permisos definidos o configurables vía entorno. */
  readonly AUTH: Record<string, number>;
  /** Límites establecidos en la lógica de la aplicación. */
  readonly LIMIT: {
    /** Límite para la cantidad de ítems permitidos. */
    readonly ITEM: number;
    /** Límite para la longitud o cantidad de caracteres en claves. */
    readonly KEY: number;
    /** Límite para la cantidad de líneas permitidas. */
    readonly LINE: number;
    /** Límite para la cantidad de marcas o marcas registradas. */
    readonly BRAND: number;
    /** Límite para documentos PDF o procesos relacionados. */
    readonly PDF: number;
  };
  /** Configuración global de imágenes. */
  readonly IMAGE: {
    /** Extensión de archivo por defecto para las imágenes. */
    readonly EXT: string;
    /** Configuración para imágenes de alta calidad. */
    readonly HIGH: AvifOptions;
    /** Configuración para imágenes de baja calidad. */
    readonly LOW: AvifOptions;
    /** Configuración para imágenes de placeholder (representación previa o de baja calidad). */
    readonly PLACEHOLDER: AvifOptions;
    /** Configuración de dimensiones para las imágenes. */
    readonly SIZE: {
      /** Ancho por defecto de la imagen. */
      readonly DEFAULT_WIDTH: number;
      /** Altura por defecto de la imagen. */
      readonly DEFAULT_HEIGHT: number;
      /** Tamaño para imágenes de placeholder. */
      readonly PLACEHOLDER: number;
    };
  };
}

/**
 * Representa los algoritmos de cifrado/firmas soportados.
 * Se alinea con la especificación JWT y otros formatos comunes.
 */
type Algorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "PS256"
  | "PS384"
  | "PS512"
  | "ES256"
  | "ES384"
  | "ES512"
  | "EdDSA";

/**
 * Mapeo interno que relaciona cadenas con los valores de tipo `Algorithm`.
 * Se utiliza para validar que el algoritmo recibido desde el entorno
 * sea uno de los soportados.
 */
const ALGORITHMS: Record<string, Algorithm> = {
  HS256: "HS256",
  HS384: "HS384",
  HS512: "HS512",
  RS256: "RS256",
  RS384: "RS384",
  RS512: "RS512",
  PS256: "PS256",
  PS384: "PS384",
  PS512: "PS512",
  ES256: "ES256",
  ES384: "ES384",
  ES512: "ES512",
  EdDSA: "EdDSA",
};

/**
 * Almacena el algoritmo seleccionado para firmar o validar.
 * Inicialmente se asigna `HS256`, pero se sobreescribe según la variable de entorno `ALG`.
 */
let ALG: Algorithm = "HS256";

/** Validación y asignación del algoritmo basado en la variable de entorno "ALG". */
const envAlg = Deno.env.get("ALG");
if (envAlg) {
  if (envAlg in ALGORITHMS) {
    ALG = ALGORITHMS[envAlg];
  } else {
    throw new Error(
      `Algoritmo inválido para ALG: ${envAlg}. Algoritmos permitidos: ${
        Object.keys(ALGORITHMS).join(", ")
      }`,
    );
  }
}

/**
 * Cadena de conexión a la base de datos MongoDB.
 * Si no se especifica en el entorno, se usa un valor local por defecto.
 */
const MONGO = Deno.env.get("MONGO") || "mongodb://localhost:27017/default";

/**
 * Indica el nombre del entorno en uso (development, production, etc.).
 * Por defecto se asigna "development".
 */
const ENV = Deno.env.get("ENV") || "development";

/**
 * Cadena secreta para firmar o encriptar tokens.
 * Si no se define en el entorno, se utiliza el valor "itssecret".
 */
const SECRET = Deno.env.get("SECRET") || "itssecret";

/**
 * Valor absoluto que puede usarse para algún ajuste de cifrado o hashing.
 * Por defecto es "itssecret".
 */
const ABSOLUTE = Deno.env.get("ABSOLUTE") || "itssecret";

/**
 * Puerto de escucha para la aplicación web.
 * Si no está definido en el entorno, se utiliza 8000.
 */
const PORT = Number(Deno.env.get("PORT")) || 8000;

/**
 * Conjunto de valores por defecto para permisos de autenticación.
 * Se definen usando desplazamiento de bits (bit flags).
 */
const DEFAULT = {
  /** Permiso para lectura: bit 0. */
  AUTH_READ: 1 << 0,
  /** Permiso para escritura: bit 1. */
  AUTH_WRITE: 1 << 1,
  /** Permiso para edición: bit 2. */
  AUTH_EDIT: 1 << 2,
  /** Permiso para otorgar permisos: bit 3. */
  AUTH_GRANT: 1 << 3,
  /** Permiso de administrador: bit 4. */
  AUTH_ADMIN: 1 << 4,
};

/**
 * Convierte un valor del entorno en un número que representará un permiso.
 *
 * @param env - Nombre de la variable de entorno (por ejemplo, "AUTH_READ").
 * @param def - Valor por defecto si la variable de entorno no existe.
 * @returns Un número entero que representa el permiso.
 * @throws Si el valor del entorno no es un número válido, arroja un `Error`.
 */
function getAuthValue(env: string, def: number): number {
  const value = Deno.env.get(env);
  if (value === undefined) return def;
  const num = Number(value);
  if (isNaN(num) || num <= 0 || num > 1 << 30) {
    throw new Error(`Valor inválido para ${env}: ${value}`);
  }
  return num;
}

/**
 * Objeto que centraliza los valores de permisos de la aplicación.
 * Cada propiedad (READ, WRITE, EDIT, GRANT, ADMIN) proviene de las variables
 * de entorno equivalentes, con un fallback a los valores por defecto.
 */
const AUTH = Object.fromEntries(
  Object.entries(DEFAULT).map(([key, def]) => [
    key.replace("AUTH_", ""),
    getAuthValue(key, def),
  ]),
) as {
  READ: number;
  WRITE: number;
  EDIT: number;
  GRANT: number;
  ADMIN: number;
};

/**
 * Límites de ciertos campos o ítems en la aplicación.
 * Se definen como `const` para no permitir cambios en tiempo de ejecución.
 */
const LIMIT = {
  /** Límite para la cantidad de ítems permitidos. */
  ITEM: 24,
  /** Límite para la longitud o cantidad de caracteres en claves. */
  KEY: 18,
  /** Límite para la cantidad de líneas permitidas. */
  LINE: 20,
  /** Límite para la cantidad de marcas o marcas registradas. */
  BRAND: 20,
  /** Límite para documentos PDF o procesos relacionados. */
  PDF: 25,
} as const satisfies SetupConfig["LIMIT"];

/**
 * Configuración global de imágenes.
 */
const IMAGE = {
  /** Extensión de archivo por defecto para las imágenes. */
  EXT: "jpg",
  /** Configuración para imágenes de alta calidad. */
  HIGH: {
    /** Calidad de la imagen (100 es la máxima calidad). */
    QUALITY: 100,
    /** Nivel de esfuerzo en la compresión para optimización. */
    EFFORT: 5,
    /** Indica si la compresión es sin pérdida. */
    LOSSLESS: false,
    /** Configuración de muestreo de crominancia ("4:4:4"). */
    CHROMA: "4:4:4",
  },
  /** Configuración para imágenes de baja calidad. */
  LOW: {
    /** Calidad de la imagen reducida para optimización. */
    QUALITY: 80,
    /** Nivel de esfuerzo en la compresión para optimización. */
    EFFORT: 3,
    /** Indica si la compresión es sin pérdida. */
    LOSSLESS: false,
    /** Configuración de muestreo de crominancia ("4:2:0"). */
    CHROMA: "4:2:0",
  },
  /** Configuración para imágenes de placeholder. */
  PLACEHOLDER: {
    /** Calidad mínima de la imagen para placeholder. */
    QUALITY: 20,
    /** Nivel de esfuerzo mínimo en la compresión. */
    EFFORT: 1,
    /** Indica si la compresión es sin pérdida. */
    LOSSLESS: false,
    /** Configuración de muestreo de crominancia ("4:2:0"). */
    CHROMA: "4:2:0",
  },
  /** Configuración de dimensiones para las imágenes. */
  SIZE: {
    /** Ancho por defecto de la imagen. */
    DEFAULT_WIDTH: 708,
    /** Altura por defecto de la imagen. */
    DEFAULT_HEIGHT: 500,
    /** Tamaño para imágenes de placeholder. */
    PLACEHOLDER: 40,
  },
} as const satisfies SetupConfig["IMAGE"];

/**
 * Objeto principal con toda la configuración centralizada.
 */
export const setup: SetupConfig = {
  ENV,
  PORT,
  MONGO,
  KEY: {
    SECRET,
    ALG,
    ABSOLUTE,
  },
  AUTH,
  LIMIT,
  IMAGE,
};
export type { SetupConfig };
