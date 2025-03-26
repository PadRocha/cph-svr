import type { HydratedDocument, Model, Types } from "mongoose";

/**
 * Representa una marca con un código único y una descripción.
 *
 * @remarks
 * **Nota:** El campo `code` en cada entidad (`Line`, `Brand`, `Item`)
 * es un identificador único que se utiliza para formar un identificador
 * global concatenado. Por ejemplo, una combinación de `Line.code`,
 * `Brand.code` e `Item.code` puede formar un código único como `"GRAPVH0001"`.
 */
interface Brand {
  /**
   * Código único de la marca.
   *
   * @example
   * ```ts
   * "PVH"
   * ```
   */
  readonly code: string;

  /**
   * Descripción textual de la marca.
   */
  readonly desc: string;
}

/**
 * Métodos de instancia para el documento `Brand`.
 *
 * @remarks
 * Actualmente está definido como un mapeo vacío (`Record<symbol, null>`),
 * pero aquí se podrían declarar métodos de instancia adicionales si
 * existieran en el futuro.
 */
type BrandMethods = Record<symbol, null>;

/**
 * Interfaz para el modelo de Mongoose que maneja la colección "Brand".
 *
 * @remarks
 * - Hereda de `Model<Brand>` y además define el método estático `findByCode()`.
 * - `findByCode()` permite buscar el ObjectId de una marca según su code,
 *   retornando `null` si no existe.
 */
interface BrandModel extends Model<Brand, Record<symbol, null>, BrandMethods> {
  /**
   * Busca una marca en la base de datos por su code,
   * y retorna su `ObjectId` si la encuentra, en caso contrario `null`.
   *
   * @param code - Una cadena o `Types.ObjectId` que identifica la marca.
   * @returns Una promesa que resuelve al `ObjectId` de la marca o `null`.
   */
  findByCode(code?: Types.ObjectId | string): Promise<Types.ObjectId | null>;
}

/**
 * Documento de Mongoose para la marca, que extiende las propiedades de `Brand`
 * y los métodos `BrandMethods`, además de mantener la estructura de un
 * `HydratedDocument`.
 */
type BrandDocument = HydratedDocument<Brand, BrandMethods>;

/**
 * Versión "plana" (lean) de una Marca, incluyendo el `_id`.
 *
 * @remarks
 * Útil para retornos de queries con `.lean()`, donde
 * se obtiene un objeto simple sin métodos de documento.
 */
type LeanBrand = Brand & { _id: Types.ObjectId };

export type { Brand, BrandDocument, BrandMethods, BrandModel, LeanBrand };
