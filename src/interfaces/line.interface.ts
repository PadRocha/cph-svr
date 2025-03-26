import type { HydratedDocument, Model, Types } from "mongoose";

/**
 * Representa una línea en el sistema, con un código único y una descripción.
 *
 * @remarks
 * El campo `code` se utiliza como identificador único para la línea y se formatea para que tenga
 * exactamente 3 caracteres, rellenándose con espacios a la derecha si es necesario.
 */
interface Line {
  /**
   * Código único de la línea.
   *
   * @example
   * "PVH"
   */
  readonly code: string;

  /**
   * Descripción de la línea.
   *
   * @example
   * "línea de ejemplo"
   */
  readonly desc: string;
}

/**
 * Métodos de instancia para documentos de tipo `Line`.
 *
 * @remarks
 * Actualmente es un registro vacío, pero se puede ampliar en el futuro.
 */
type LineMethods = Record<symbol, null>;

/**
 * Interfaz del modelo Mongoose para la colección de `Line`.
 *
 * @remarks
 * Proporciona el método estático `findByCode` para buscar una línea por su código
 * o identificador.
 */
interface LineModel extends Model<Line, Record<symbol, null>, LineMethods> {
  /**
   * Busca una línea por su `code` y retorna su `_id` en caso de existir,
   * o `null` si no se encuentra.
   *
   * @param code - ObjectId o string que identifica la línea.
   * @returns Una promesa que resuelve con el `_id` de la línea o `null`.
   *
   * @example
   * ```ts
   * const id = await LineModel.findByCode("PVH");
   * console.log(id); // ObjectId o null
   * ```
   */
  findByCode(code?: Types.ObjectId | string): Promise<Types.ObjectId | null>;
}

/**
 * Documento de Mongoose para una línea, que combina los campos de `Line`
 * y los métodos de `LineMethods` con la infraestructura interna de Mongoose.
 */
type LineDocument = HydratedDocument<Line, LineMethods>;

/**
 * Versión "lean" de `Line`, que incluye la propiedad `_id`.
 */
type LeanLine = Line & { _id: Types.ObjectId };

export type { LeanLine, Line, LineDocument, LineMethods, LineModel };
