import { PipelineStage } from 'mongoose';

/**
 * Interfaz que representa la etapa `$facet` en un pipeline de MongoDB.
 *
 * @remarks
 * Cada propiedad `[k: string]` define un “facet” que ejecutará
 * un subconjunto de pasos de agregación en paralelo.
 */
interface Facet<T = PipelineStage.Facet["$facet"]> {
  /**
   * Facet que recorre documentos y filtra/agrupa resultados con imágenes
   * que tengan cierto estado (`status` = 5).
   */
  readonly DELETE_ITEMS: T;

  /**
   * Facet de estadísticas generales.
   * - `status`: hace un `$sortByCount` del campo `images.status`.
   * - `success`: agrupa las imágenes con `status = 5`.
   */
  readonly INFO: T;
}

/**
 * Objeto con definiciones de facets concretas para la aplicación.
 *
 * - `DELETE_ITEMS`: Realiza conteo de estado de imágenes y agrupa
 *   las que tengan `images.status = 5`.
 * - `INFO`: Similar a `DELETE_ITEMS` pero devuelven estadísticas
 *   distintas en cada facet.
 */
const FACET: Facet = {
  DELETE_ITEMS: {
    status: [
      { $unwind: "$images" },
      { $sortByCount: "$images.status" },
    ],
    images: [
      { $unwind: "$images" },
      { $match: { "images.status": 5 } },
      {
        $project: {
          _id: "$key._id",
          key: {
            $concat: ["$key.line.code", "$key.brand.code"], // corregido!
          },
          file: {
            $concat: [
              "$key.line.code",
              "$key.brand.code",
              "$code",
              " ",
              { $toString: "$images.idN" },
              ".",
              "$images.ext",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          code: { $first: "$key" }, // optimizado: no necesitas $$ROOT
          files: { $push: "$file" },
        },
      },
    ],
  },
  // DELETE_ITEMS: {
  //   status: [
  //     { $unwind: "$images" },
  //     { $sortByCount: "$images.status" },
  //   ],
  //   images: [
  //     {
  //       $match: { "images.status": 5 },
  //     },
  //     { $unwind: "$images" },
  //     {
  //       $project: {
  //         _id: "$key._id",
  //         key: {
  //           $concat: ["$key.line.code", "$key.line.code"],
  //         },
  //         file: {
  //           $concat: [
  //             "$key.line.code",
  //             "$key.line.code",
  //             "$code",
  //             " ",
  //             {
  //               $toString: "$images.idN",
  //             },
  //             ".",
  //             "$images.ext",
  //           ],
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: "$_id",
  //         code: { $first: "$$ROOT.key" },
  //         files: { $push: "$file" },
  //       },
  //     },
  //   ],
  // },
  INFO: {
    status: [
      { $unwind: "$images" },
      { $sortByCount: "$images.status" },
    ],
    success: [
      { $unwind: "$images" },
      {
        $match: { "images.status": 5 },
      },
      {
        $group: { _id: "$_id" },
      },
      { $count: "count" },
    ],
  },
};

export { FACET };
export type { Facet };
