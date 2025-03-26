import type { LeanBrand } from "@interfaces/brand.interface.ts";
import { setup } from "config";
import { isValidObjectId } from "deps";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel } from "models";

import { buildPagePipeline, formatPage } from "@utils/pagination.ts";

type Answer = {
  data: LeanBrand[];
  totalDocs: number;
};

/**
 * @api {get} /api/brand Obtener Marcas
 * @apiVersion 1.0.0
 * @apiName GetBrand
 * @apiGroup Brand
 * @apiPermission user
 *
 * @apiDescription Este endpoint permite obtener una lista de marcas o una marca específica. Requiere permisos de 'READ', 'WRITE', 'EDIT', 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} [page] Número de página para la paginación de resultados.
 * @apiParam (Query string) {String} [id] Identificador único de la marca para obtener una marca específica.
 *
 * @apiSuccess {Object[]} data Lista de marcas o una marca específica.
 * @apiSuccess {String} data.code Código de la marca.
 * @apiSuccess {String} data.desc Descripción de la marca.
 * @apiSuccess {Date} data.createdAt Fecha de creación.
 * @apiSuccess {Date} data.updatedAt Fecha de actualización.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "code": "BRD",
 *           "desc": "Marca de ejemplo"
 *         }
 *       ]
 *     }
 *
 * @apiError (400) BadRequest Los parámetros proporcionados no son válidos.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontraron documentos.
 *
 * @apiErrorExample {json} Respuesta de error 403:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": ()
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 404:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "No se encontraron marcas"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X GET http://localhost:3000/api/brand?page=1 \
 *     -H "Authorization: Bearer <User_Token>"
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _page = req.query("page");
  if (_page) {
    const page = Number(_page) || 1;
    const limit = setup.LIMIT.BRAND;
    const [{ data, totalDocs }] = await BrandModel.aggregate<Answer>()
      .project({ code: 1, desc: 1 })
      .sort("code")
      .append(...buildPagePipeline(limit, page));

    if (data.length < 1) throw new NotFoundError("No se encontraron marcas");

    return json(formatPage(data, limit, totalDocs, page));
  }

  const _id = req.query("id");
  if (isValidObjectId(_id)) {
    const data = await BrandModel.findOne({ _id }).select("code desc").lean();
    if (!data) throw new NotFoundError("No se encontraron marcas");

    return json({ data });
  }

  const data = await BrandModel.find().select("code desc").lean();
  if (!data) throw new NotFoundError("No se encontraron marcas");

  return json({ data });
});
