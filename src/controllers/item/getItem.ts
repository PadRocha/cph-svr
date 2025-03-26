import type { PopulatedItem } from "@interfaces/item.interface.ts";
import { pipeline } from 'aggregate';
import { setup } from 'config';
import { isValidObjectId } from 'deps';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';
import { PipelineStage } from 'mongoose';

import { buildPagePipeline, formatPage } from '@utils/pagination.ts';
import { ParserPipeline } from '@utils/pipeline_builder.ts';

// import { InstructionParser } from '@utils/parser.ts';
// import { SearchPipelineBuilder } from '@utils/searchBuilder.ts';

type AnswerPage = {
  data: PopulatedItem[];
  totalDocs: number;
};

/**
 * @api {get} /api/item Obtener Item
 * @apiVersion 1.0.0
 * @apiName GetItem
 * @apiGroup Item
 * @apiPermission user
 *
 * @apiDescription Este método obtiene una lista de items o un item específico del sistema. Puede ser ejecutado por usuarios con permisos de lectura y escritura.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} [page] Número de página para la paginación de resultados.
 * @apiParam (Query string) {String} [search] Término de búsqueda para filtrar items por código o descripción.
 * @apiParam (Query string) {String} [status] Estado de las imágenes para filtrar items (0-5).
 * @apiParam (Query string) {String} [id] ID del item específico a obtener.
 *
 * @apiParamExample {json} Request-Example:
 *     GET /api/item?page=2&search=main&status=2&id=5f4471326b54a216c46f1a6e HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <User_Token>
 *
 * @apiSuccess (200) {Object[]} data Lista de items o el item específico.
 * @apiSuccess (200) {String} data.code Código del item.
 * @apiSuccess (200) {String} data.desc Descripción del item.
 * @apiSuccess (200) {Object[]} data.images Imágenes asociadas al item.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "code": "LNEBRD0001",
 *           "desc": "Descripción del item",
 *           "images": [
 *             {
 *               "idN": 1,
 *               "status": 2
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *
 * @apiError (400) BadRequest No se enviaron los parámetros necesarios o hay un error con los parámetros.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontraron documentos.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X GET http://localhost:3000/api/item?page=2&search=main&status=2&id=5f4471326b54a216c46f1a6e \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <User_Token>"
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _page = req.query("page");
  if (_page) {
    const page = Number(_page) || 1;
    const limit = setup.LIMIT.ITEM;
    const aggregate = ItemModel.aggregate<AnswerPage>();
    const { parseResult, pipeline: search } = await ParserPipeline
      .getPipelineForInstruction(req.query("search"));
    if (parseResult.desc) {
      aggregate.match({ $text: { $search: parseResult.desc } });
      aggregate.addFields({ score: { $meta: "textScore" } });
    }

    const status = Number(req.query("status"));
    if (!isNaN(status) && status >= 0 && status <= 5) {
      aggregate.match({ "images.status": status });
    }

    const project: PipelineStage.FacetPipelineStage = {
      $project: pipeline.PROJECT.ITEM,
    };
    const sort: PipelineStage.FacetPipelineStage = {
      $sort: parseResult.desc
        ? { score: -1 }
        : { "key.line.code": 1, "key.brand.code": 1, code: 1 },
    };
    const [{ data, totalDocs }] = await aggregate
      .lookup(pipeline.LOOKUP.KEY).unwind("$key")
      .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
      .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
      .append(...search)
      .append(...buildPagePipeline(limit, page, sort, project));
    if (data.length < 1) throw new NotFoundError("No se encontraron docs");

    return json(formatPage(data, limit, totalDocs, page));
  }

  const _id = req.query("id");
  if (isValidObjectId(_id)) {
    const [data] = await ItemModel.getPopulate(_id);
    if (!data) throw new NotFoundError("No se encontraron líneas");
    return json({ data });
  }

  const data = await ItemModel.getPopulate();
  if (data.length < 1) throw new NotFoundError("No se encontraron líneas");
  return json({ data });
});
