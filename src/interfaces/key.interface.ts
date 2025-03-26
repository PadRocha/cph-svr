import type { Aggregate, HydratedDocument, Model, Types } from "mongoose";
import type { LeanBrand } from "@interfaces/brand.interface.ts";
import type { LeanLine } from "@interfaces/line.interface.ts";

/**
 * Representa una clave en el sistema, compuesta por una línea y una marca asociadas.
 *
 * @remarks
 * **Nota:** Cada clave está asociada a una única combinación de `Line` y `Brand`.
 * Esto asegura un identificador conjunto. Adicionalmente, puede tener un contador
 * (`countItems`) que almacene la cantidad de items relacionados, si procede.
 *
 * @example
 * **Ejemplo de Código Concatenado:**
 * - LINE: GRA
 * - BRAND: PVH
 * Concatenado: `GRAPVH`
 */
interface Key {
  /**
   * Identificador de la línea, puede ser un `ObjectId` o un string.
   */
  readonly line: Types.ObjectId | string;

  /**
   * Identificador de la marca, puede ser un `ObjectId` o un string.
   */
  readonly brand: Types.ObjectId | string;

  /**
   * Número opcional que indica la cantidad de items relacionados a esta clave.
   */
  countItems?: number;
}

/**
 * Métodos de instancia que pueden ser asignados a un documento de `Key`.
 * Actualmente es un mapeo vacío, pero queda listo para futuras ampliaciones.
 */
type KeyMethods = Record<string | number | symbol, null>;

/**
 * Interfaz del modelo Mongoose para `Key`.
 *
 * @remarks
 * - Incluye métodos estáticos como `findByCode`, `getPopulate` y `getFuzzy`.
 * - Se basa en la interfaz `Key` para la definición de sus campos.
 */
interface KeyModel extends Model<Key, Record<symbol, null>, KeyMethods> {
  /**
   * Busca una clave por su `code` (objeto o string) y retorna su `_id`
   * en caso de existir, o `null` en caso contrario.
   *
   * @param code - ObjectId o string que identifica la clave
   * @returns Una promesa que resuelve con el `_id` de la clave o `null`.
   *
   * @example
   * ```ts
   * const keyId = await KeyModel.findByCode("63abf...id");
   * if (keyId) {
   *   console.log("Clave encontrada:", keyId);
   * } else {
   *   console.log("No existe clave con ese code");
   * }
   * ```
   */
  findByCode(code?: Types.ObjectId | string): Promise<Types.ObjectId | null>;

  /**
   * Obtiene información poblada a partir de un pipeline de agregación,
   * devolviendo un `Aggregate` con el tipo `PopulatedKey` (o T genérico).
   *
   * @param id - Opcional, para filtrar por `_id` en la búsqueda
   * @typeParam T - El tipo genérico devuelto (por defecto `PopulatedKey`)
   * @returns Una instancia de `Aggregate<T[]>`
   *
   * @example
   * ```ts
   * const pipeline = KeyModel.getPopulate<PopulatedKey>("63abf...id");
   * const populatedKeys = await pipeline.exec();
   * console.log("Resultado poblado:", populatedKeys);
   * ```
   */
  getPopulate<T = PopulatedKey>(id?: string): Aggregate<T[]>;

  /**
   * Realiza una búsqueda difusa (fuzzy) según un código parcial, retornando
   * un `Aggregate` que produce `{ code: string }`.
   *
   * @param key - Fragmento de cadena para la línea o marca
   * @returns Un pipeline de agregación con los resultados que incluyan la propiedad `code`.
   *
   * @example
   * ```ts
   * const results = await KeyModel.getFuzzy("AB").exec();
   * results.forEach(r => console.log(r.code));
   * ```
   */
  getFuzzy(key: string): Aggregate<{ code: string }[]>;
}

/**
 * Documento de Mongoose para una `Key`, que combina las definiciones
 * de `Key` y métodos `KeyMethods`, además de la infraestructura interna
 * de Mongoose.
 */
type KeyDocument = HydratedDocument<Key, KeyMethods>;

/**
 * Representa una `Key` en modo "lean", que añade la propiedad `_id`.
 */
type LeanKey = Key & { _id: Types.ObjectId };

/**
 * Versión poblada de la `Key`, donde se reemplazan `line` y `brand`
 * por `LeanLine` y `LeanBrand`, respectivamente.
 */
interface PopulatedKey extends Omit<LeanKey, "line" | "brand"> {
  /**
   * Objeto poblado que describe la línea asociada.
   */
  readonly line?: LeanLine;

  /**
   * Objeto poblado que describe la marca asociada.
   */
  readonly brand?: LeanBrand;

  /**
   * Código concatenado de la clave (line.code + brand.code).
   *
   * @example
   * "GRAPVH"
   */
  readonly code?: string;

  /**
   * Descripción resultante de la concatenación,
   * o información adicional relativa a la clave.
   */
  readonly desc?: string;
}

export type { Key, KeyDocument, KeyMethods, KeyModel, LeanKey, PopulatedKey };
