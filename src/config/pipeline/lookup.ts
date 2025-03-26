import { PipelineStage } from 'mongoose';

/**
 * Interfaz que representa la etapa `$lookup` en un pipeline de MongoDB.
 *
 * @remarks
 * Cada propiedad define una configuración para enlazar colecciones,
 * como "LINE", "BRAND", "KEY", etc.
 *
 * @typeParam T - Se alinea con la definición nativa de Mongoose para `$lookup`.
 */
interface Lookup<T = PipelineStage.Lookup["$lookup"]> {
  /** Relaciona la colección `lines` con el campo local `line`. */
  readonly LINE: T;

  /** Relaciona la colección `brands` con el campo local `brand`. */
  readonly BRAND: T;

  /** Relaciona la colección `keys` con el campo local `key`. */
  readonly KEY: T;

  /** Relaciona la subpropiedad `key.line` con la colección `lines`. */
  readonly KEY_LINE: T;

  /** Relaciona la subpropiedad `key.brand` con la colección `brands`. */
  readonly KEY_BRAND: T;
}

/**
 * Objeto de lookup que realiza "joins" entre colecciones de MongoDB.
 * Cada clave representa una asociación distinta.
 */
const LOOKUP: Lookup = {
  LINE: {
    from: "lines",
    localField: "line",
    foreignField: "_id",
    as: "line",
  },
  BRAND: {
    from: "brands",
    localField: "brand",
    foreignField: "_id",
    as: "brand",
  },
  KEY: {
    from: "keys",
    localField: "key",
    foreignField: "_id",
    as: "key",
    // from: "keys",
    // let: { keyId: "$key" },
    // pipeline: [
    //   {
    //     $match: {
    //       $expr: { $eq: ["$_id", "$$keyId"] },
    //     },
    //   },
    //   { $project: { _id: 0, line: 1, brand: 1 } },
    // ],
    // as: "key",
  },
  KEY_LINE: {
    from: "lines",
    localField: "key.line",
    foreignField: "_id",
    as: "key.line",
    // from: "lines",
    // let: { lineId: "$key.line" },
    // pipeline: [
    //   { $match: { $expr: { $eq: ["$_id", "$$lineId"] } } },
    //   { $project: { _id: 0, code: 1 } },
    // ],
    // as: "key.line",
  },
  KEY_BRAND: {
    from: "brands",
    localField: "key.brand",
    foreignField: "_id",
    as: "key.brand",
    // from: "brands",
    // let: { brandId: "$key.brand" },
    // pipeline: [
    //   { $match: { $expr: { $eq: ["$_id", "$$brandId"] } } },
    //   { $project: { _id: 0, code: 1 } },
    // ],
    // as: "key.brand",
  },
};

export { LOOKUP };
export type { Lookup };
