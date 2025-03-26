import type { LeanLine } from "@interfaces/line.interface.ts";
import { setup } from "config";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { LineModel } from "models";
import { isValidObjectId } from "mongoose";

import { buildPagePipeline, formatPage } from "@utils/pagination.ts";

type Answer = {
  data: LeanLine[];
  totalDocs: number;
};

/**
 * @api {get} /api/line Obtener Líneas
 * @apiVersion 1.0.0
 * @apiName GetLine
 * @apiGroup Line
 * @apiPermission user
 *
 * @apiDescription Este método obtiene una lista de líneas o una línea específica del sistema. Puede ser ejecutado por usuarios con permisos de lectura y escritura.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} [page] Número de página para la paginación de resultados.
 * @apiParam (Query string) {String} [id] ID de la línea específica a obtener.
 *
 * @apiParamExample {json} Request-Example:
 *     GET /api/line?page=2 HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <User_Token>
 *
 * @apiSuccess (200) {Object[]} data Lista de líneas o la línea específica.
 * @apiSuccess (200) {String} data.code Código de la línea.
 * @apiSuccess (200) {String} data.desc Descripción de la línea.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "code": "LNE001",
 *           "desc": "Línea de ejemplo"
 *         }
 *       ]
 *     }
 *
 * @apiError (404) NotFound No se encontraron documentos.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Locked
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X GET http://localhost:3000/api/line?page=2 \
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
    const limit = setup.LIMIT.LINE;
    const [{ data, totalDocs }] = await LineModel.aggregate<Answer>()
      .project({ code: 1, desc: 1 })
      .sort("code")
      .append(...buildPagePipeline(limit, page));

    if (data.length < 1) throw new NotFoundError("No se encontraron líneas");

    return json(formatPage(data, limit, totalDocs, page));
  }

  const _id = req.query("id");
  if (isValidObjectId(_id)) {
    const data = await LineModel.findOne({ _id }).select("code desc").lean();
    if (!data) throw new NotFoundError("No se encontraron líneas");

    return json({ data });
  }

  const data = await LineModel.find().select("code desc").lean();
  if (!data) throw new NotFoundError("No se encontraron líneas");

  return json({ data });
});
