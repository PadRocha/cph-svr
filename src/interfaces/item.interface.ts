import type { Aggregate, HydratedDocument, Model, Types } from "mongoose";
import type { PopulatedKey } from "@interfaces/key.interface.ts";

/**
 * Representa una imagen asociada a un ítem.
 */
interface Image {
  /**
   * Número identificador (ID interno) de la imagen.
   */
  readonly idN: number;

  /**
   * Estado actual de la imagen, representado como un número.
   *
   * @remarks
   * Los valores pueden representar diferentes estados, por ejemplo:
   * - 0: Defectuoso
   * - 1: Encontrado
   * - 2: Fotografiado
   * - 3: Preparado
   * - 4: Editado
   * - 5: Guardado
   */
  readonly status: number;
  /** Extensión de la imagen */
  ext: string;
}

/**
 * Representa el documento principal de un "ítem" en el sistema.
 *
 * @example
 * ```ts
 * // Ejemplo de creación de un nuevo ítem con una imagen
 * const newItem = new ItemModel({
 *   code: "0001",
 *   desc: "Descripción de prueba",
 *   images: [{ idN: 1, status: 0 }],
 *   key: "632ef2c...", // un ObjectId como string
 * });
 * await newItem.save();
 * console.log("Item guardado con _id:", newItem._id);
 * ```
 */
interface Item {
  /**
   * Referencia a la clave (Key) asociada a este ítem. Puede ser un
   * ObjectId de Mongoose o un string.
   */
  readonly key?: Types.ObjectId | string;

  /**
   * Código único del ítem en la base de datos.
   *
   * @remarks
   * **Descripción Extendida:**
   * - Este campo almacena un identificador único dentro de la colección de ítems.
   * - Aunque es único, en la práctica, este código suele ser reemplazado por un
   *   identificador global que resulta de la concatenación de los códigos de
   *   `Line`, `Brand` y `Item`.
   * - De esta manera, cada ítem conserva un identificador jerárquico dentro
   *   del sistema, por ejemplo: `GRAPVH0001`.
   *
   * @example
   * **Ejemplo de Código (solo ítem)**:
   * ```ts
   * "0001"
   * ```
   *
   * **Ejemplo de Código Concatenado**:
   * - LINE: GRA
   * - BRAND: PVH
   * - ITEM: 0001
   * Concatenado: `GRAPVH0001`
   */
  readonly code: string;

  /**
   * Descripción textual del ítem.
   */
  readonly desc: string;

  /**
   * Arreglo de imágenes asociadas a este ítem.
   * Cada imagen posee un ID y un estado.
   */
  images: Image[];
}

/**
 * Representa los contadores de estado para un conjunto de imágenes.
 *
 * @remarks
 * Se usa para reportar cuántas imágenes están en cada fase.
 */
interface StatusInfo {
  /** Cantidad de imágenes defectuosas. */
  readonly defective: number;
  /** Cantidad de imágenes encontradas. */
  readonly found: number;
  /** Cantidad de imágenes fotografiadas. */
  readonly photographed: number;
  /** Cantidad de imágenes preparadas. */
  readonly prepared: number;
  /** Cantidad de imágenes editadas. */
  readonly edited: number;
  /** Cantidad de imágenes guardadas. */
  readonly saved: number;
}

/**
 * Representa la información de elementos eliminados (o preparados
 * para eliminación), que incluye un resumen de estados y la lista de
 * archivos a borrar.
 */
interface DeletedInfo {
  /**
   * Información agregada sobre los estados de las imágenes.
   */
  readonly status: StatusInfo;
  /**
   * Lista de documentos, cada uno con un `_id`, un `code` y
   * los `files` asociados.
   */
  readonly images: {
    readonly _id: Types.ObjectId;
    readonly code: string;
    readonly files: string[];
  }[];
}

/**
 * Métodos de instancia que se pueden asignar a un documento de `Item`.
 * Actualmente vacío, pero puedes extenderlo en el futuro.
 */
type ItemMethods = Record<symbol, null>;

/**
 * Interfaz para el modelo Mongoose de `Item`.
 *
 * @remarks
 * Incluye métodos estáticos adicionales, como `findByCode`, `getBackInfo`,
 * `getPopulate`, `getFuzzy`, `getStatus` y `getImage`.
 */
interface ItemModel extends Model<Item, Record<symbol, null>, ItemMethods> {
  /**
   * Busca un ítem por su `code` y retorna su `_id` en caso de existir,
   * o `null` en caso contrario.
   *
   * @param code - ObjectId o string que identifica el ítem
   * @returns Una promesa que resuelve con el `_id` del ítem o `null`.
   *
   * @example
   * ```ts
   * const foundId = await ItemModel.findByCode("GRAPVH0001");
   * console.log(foundId); // ObjectId o null
   * ```
   */
  findByCode(code?: Types.ObjectId | string): Promise<Types.ObjectId | null>;

  /**
   * Recupera información de eliminación (back info) asociada a un campo y un ID.
   *
   * @param field - Nombre del campo de búsqueda
   * @param id - ID con el que filtrar
   * @returns Una promesa que resuelve con `DeletedInfo`.
   *
   * @example
   * ```ts
   * const info = await ItemModel.getBackInfo("_id", "63abf...id");
   * console.log(info.status, info.images);
   * ```
   */
  getBackInfo(field: string, id: string): Promise<DeletedInfo>;

  /**
   * Obtiene datos poblados a partir de un pipeline de agregación, devolviendo
   * un `Aggregate` con el tipo `PopulatedItem`.
   *
   * @param id - Opcional, para filtrar
   * @typeParam T - El tipo genérico devuelto (por defecto `PopulatedItem`)
   * @returns Una instancia de `Aggregate<T[]>`
   *
   * @example
   * ```ts
   * const pipeline = ItemModel.getPopulate<PopulatedItem>("63abf...id");
   * const populated = await pipeline.exec();
   * console.log(populated);
   * ```
   */
  getPopulate<T = PopulatedItem>(id?: string): Aggregate<T[]>;

  /**
   * Ejecuta una búsqueda difusa (fuzzy) sobre un `key` y un `code`.
   * Retorna un `Aggregate` que en su resultado incluye `{ code: string }`.
   *
   * @param key - Cadena de búsqueda para la key
   * @param code - Cadena de búsqueda para el code
   *
   * @example
   * ```ts
   * const results = await ItemModel.getFuzzy("GRAPVH", "0001").exec();
   * results.forEach(doc => console.log(doc.code));
   * ```
   */
  getFuzzy(key: string, code: string): Aggregate<{ code: string }[]>;

  /**
   * Obtiene el estado de una imagen específica, identificada por `id` (del Item)
   * e `idN` (ID interno de la imagen).
   *
   * @param id - El `_id` del documento `Item`
   * @param idN - El ID interno de la imagen
   * @returns Un pipeline de agregación que produce un arreglo con
   * `{ code: string, image: PopulatedItem["images"][number] }`.
   *
   * @example
   * ```ts
   * const imageStatusAgg = ItemModel.getStatus("63abf...id", 2);
   * const [result] = await imageStatusAgg.exec();
   * console.log(result.code, result.image.status);
   * ```
   */
  getStatus(
    id: string,
    idN: number,
  ): Aggregate<{
    code: string;
    image: PopulatedItem["images"][number];
  }[]>;

  /**
   * Obtiene la información de una imagen en particular, retornando su nombre
   * de archivo, la key y el code, además de la imagen en sí.
   *
   * @param id - El `_id` del documento `Item`
   * @param idN - El ID interno de la imagen
   * @returns Un pipeline de agregación que produce un arreglo con
   * `{ file: string, key: string, code: string, image: LeanItem["images"][number] }`.
   *
   * @example
   * ```ts
   * const imageAgg = ItemModel.getImage("63abf...id", 2);
   * const [imgInfo] = await imageAgg.exec();
   * console.log(imgInfo.file, imgInfo.key, imgInfo.code, imgInfo.image);
   * ```
   */
  getImage(
    id: string,
    idN: number,
  ): Aggregate<{
    file: string;
    key: string;
    code: string;
    image: LeanItem["images"][number];
    ext: string;
  }[]>;
}

/**
 * Documento de Mongoose para un ítem, que combina los campos de `Item`,
 * los métodos de  `ItemMethods`, y la infraestructura interna de Mongoose
 * (HydratedDocument).
 */
type ItemDocument = HydratedDocument<Item, ItemMethods>;

/**
 * Versión "lean" de `Item`, donde además se añade la propiedad `_id`.
 */
type LeanItem = Item & { _id: Types.ObjectId };

/**
 * Versión poblada (cuando se hace `populate`), la cual
 * reemplaza `key` con un `PopulatedKey`.
 */
interface PopulatedItem extends Omit<LeanItem, "key"> {
  /** Clave poblada desde la colección "Key" */
  readonly key?: PopulatedKey;
}

export type {
  DeletedInfo,
  Image,
  Item,
  ItemDocument,
  ItemMethods,
  ItemModel,
  LeanItem,
  PopulatedItem,
  StatusInfo,
};
