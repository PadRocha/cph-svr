import type { PipelineStage } from "mongoose";

/**
 * @api {function} pagination Paginación de Resultados
 * @apiVersion 1.0.0
 * @apiName Pagination
 * @apiGroup Utils
 *
 * @apiDescription Esta función genera una tubería de agregación para la paginación de documentos en MongoDB utilizando Mongoose.
 *
 * @apiParam {Number} $limit Límite de documentos por página.
 * @apiParam {Number} page Número de página actual.
 * @apiParam {PipelineStage.FacetPipelineStage[]} append Etapas adicionales de agregación (opcional).
 *
 * @apiSuccess {Object[]} data Lista de documentos de la página actual.
 * @apiSuccess {Number} totalDocs Número total de documentos disponibles.
 *
 * @apiExample {typescript} Ejemplo de uso:
 *
 *     const results: Aggregate<any[]> = await MyModel.aggregate(pagination(10, 1, { $match: { status: 'active' } }));
 *
 * @apiNote Esta función devuelve una tubería de agregación que debe ser ejecutada en un modelo Mongoose.
 */
export const buildPagePipeline = (
  limit: number,
  page: number,
  sort?: PipelineStage.FacetPipelineStage,
  ...append: PipelineStage.FacetPipelineStage[]
): PipelineStage[] => {
  const skip = limit * (page - 1);
  const castSort = sort ? [sort] : [];
  return [
    {
      $facet: {
        data: [
          ...castSort,
          { $skip: skip },
          { $limit: limit },
          ...append,
        ],
        total: [
          { $count: "count" },
        ],
      },
    },
    {
      $project: {
        data: 1,
        totalDocs: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
      },
    },
  ];
};

export function formatPage(
  data: unknown,
  limit: number,
  total_docs: number,
  page: number,
) {
  const total_pages = Math.ceil(total_docs / limit);
  const has_next_page = total_pages > page;
  const has_prev_page = page > 1;
  return {
    data,
    metadata: {
      totalDocs: total_docs,
      limit,
      page,
      nextPage: has_next_page ? page + 1 : null,
      prevPage: has_prev_page ? page - 1 : null,
      hasNextPage: has_next_page,
      hasPrevPage: has_prev_page,
      totalPages: total_pages,
    },
  };
}
