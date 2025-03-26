import { PipelineStage } from 'mongoose';

import { transform } from '@utils/transform.ts';

/**
 * Interfaz que representa la etapa `$project` de un pipeline de MongoDB.
 *
 * @remarks
 * Cada propiedad describe cómo se proyectarán (seleccionarán/transformarán)
 * los campos de la colección. Por ejemplo, `KEY` y `ITEM` construyen
 * ciertos campos concatenados.
 *
 * @typeParam T - Coincide con la definición nativa de `$project` en Mongoose.
 */
interface Project<T = PipelineStage.Project["$project"]> {
  /** Construye un campo `code` a partir de `line.code` y `brand.code`. */
  readonly KEY: T;

  /** Proyección para un ítem, concatenando `key.line.code`, `key.brand.code` y `code`. */
  readonly ITEM: T;

  /** Muestra la forma en que se exponen `code` e `image` en la salida. */
  readonly STATUS: T;

  /** Mapea un archivo completo con extensión `.jpg`, usando `idN` como parte del nombre. */
  readonly IMAGE: T;

  /** Parecido a `IMAGE` pero omite el `_id` y expone `file` distinto. */
  readonly IMAGE_FILE: T;

  /** Estructura y reagrupa el campo `status` en un objeto. */
  readonly DELETE_ITEMS: T;

  /** @deprecated Define subcampos de `status` y cuenta cuántos cumplen con `status = 5`. */
  readonly INFO: T;

  /** @deprecated Proyección adicional para evitar valores nulos en `status`. */
  readonly INFO_NULL: T;

  /** Combina `INFO` y `INFO_NULL` para una proyección completa. */
  readonly INFO_COMPLETE: T;
}

/**
 * Objeto con varias proyecciones (`$project`) usadas en el pipeline.
 *
 * - `KEY`: concatena `line.code` y `brand.code` para formar un `code`.
 * - `ITEM`: añade lógica de concat y orden en el array `images`.
 * - etc.
 */
const PROJECT: Project = {
  KEY: {
    code: {
      $concat: ["$line.code", "$brand.code"],
    },
    desc: "$line.desc",
  },
  ITEM: {
    code: {
      $concat: ["$key.line.code", "$key.brand.code", "$code"],
    },
    desc: {
      $function: {
        body: transform,
        args: ["$desc"],
        lang: "js",
      },
    },
    images: {
      $sortArray: {
        input: "$images",
        sortBy: {
          idN: 1,
        },
      },
    },
  },
  STATUS: {
    code: {
      $concat: ["$key.line.code", "$key.brand.code", "$code"],
    },
    image: "$images",
  },
  IMAGE: {
    file: {
      $concat: [
        "$key.line.code",
        "$key.brand.code",
        "$code",
        " ",
        { $toString: "$images.idN" },
      ],
    },
    key: {
      $concat: ["$key.line.code", "$key.brand.code"],
    },
    code: {
      $concat: ["$key.line.code", "$key.brand.code", "$code"],
    },
    image: "$images",
    ext: "$images.ext",
  },
  IMAGE_FILE: {
    _id: 0,
    key: {
      $concat: ["$key.line.code", "$key.brand.code"],
    },
    file: {
      $concat: [
        "$key.line.code",
        "$key.brand.code",
        "$code",
        " ",
        { $toString: "$images.idN" },
      ],
    },
    ext: "$images.ext",
  },
  DELETE_ITEMS: {
    status: {
      $cond: {
        if: {
          $eq: ["$status", []],
        },
        then: {},
        else: {
          $arrayToObject: {
            $map: {
              input: "$status",
              as: "st",
              in: {
                k: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: ["$$st._id", 0],
                        },
                        then: "defective",
                      },
                      {
                        case: {
                          $eq: ["$$st._id", 1],
                        },
                        then: "found",
                      },
                      {
                        case: {
                          $eq: ["$$st._id", 2],
                        },
                        then: "photographed",
                      },
                      {
                        case: {
                          $eq: ["$$st._id", 3],
                        },
                        then: "prepared",
                      },
                      {
                        case: {
                          $eq: ["$$st._id", 4],
                        },
                        then: "edited",
                      },
                      {
                        case: {
                          $eq: ["$$st._id", 5],
                        },
                        then: "saved",
                      },
                    ],
                    default: "status",
                  },
                },
                v: "$$st.count",
              },
            },
          },
        },
      },
    },
    images: 1,
  },
  INFO: {
    status: {
      $cond: {
        if: { $eq: ["$status", []] },
        then: {},
        else: {
          $arrayToObject: {
            $map: {
              input: "$status",
              as: "st",
              in: {
                k: {
                  $arrayElemAt: [
                    [
                      "defective",
                      "found",
                      "photographed",
                      "prepared",
                      "edited",
                      "saved",
                    ],
                    "$$st._id",
                  ],
                },
                v: "$$st.count",
              },
            },
          },
        },
      },
    },
    success: {
      $cond: {
        if: { $eq: ["$success", []] },
        then: 0,
        else: { $first: "$success.count" },
      },
    },
  },
  INFO_NULL: {
    status: {
      $mergeObjects: [
        {
          defective: 0,
          found: 0,
          photographed: 0,
          prepared: 0,
          edited: 0,
          saved: 0,
        },
        "$status",
      ],
    },
    success: 1,
  },
  INFO_COMPLETE: {
    status: {
      $mergeObjects: [
        {
          defective: 0,
          found: 0,
          photographed: 0,
          prepared: 0,
          edited: 0,
          saved: 0,
        },
        {
          $cond: {
            if: { $eq: ["$status", []] },
            then: {},
            else: {
              $arrayToObject: {
                $map: {
                  input: "$status",
                  as: "st",
                  in: {
                    k: {
                      $arrayElemAt: [
                        [
                          "defective",
                          "found",
                          "photographed",
                          "prepared",
                          "edited",
                          "saved",
                        ],
                        "$$st._id",
                      ],
                    },
                    v: "$$st.count",
                  },
                },
              },
            },
          },
        },
      ],
    },
    success: {
      $ifNull: [{ $arrayElemAt: ["$success.count", 0] }, 0],
    },
  },
};

export { PROJECT };
export type { Project };
