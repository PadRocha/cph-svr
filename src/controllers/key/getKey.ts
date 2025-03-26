import type { LeanKey } from "@interfaces/key.interface.ts";
import { setup } from "config";
import { Aggregate, isValidObjectId } from "deps";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel, KeyModel } from "models";

import { buildPagePipeline, formatPage } from "@utils/pagination.ts";

type AnswerPage = {
  data: LeanKey[];
  totalDocs: number;
};

/**
 * @api {get} /api/key Obtener Claves
 * @apiVersion 1.0.0
 * @apiName GetKey
 * @apiGroup Key
 * @apiPermission user
 *
 * @apiDescription Este método obtiene una lista de claves o una clave específica del sistema. Puede ser ejecutado por usuarios con permisos de lectura y escritura.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} [page] Número de página para la paginación de resultados.
 * @apiParam (Query string) {String} [code] Código de la clave para búsqueda.
 * @apiParam (Query string) {String} [desc] Descripción de la clave para búsqueda.
 * @apiParam (Query string) {String} [count] Si se incluye 'key', devuelve el conteo de ítems asociados a cada clave.
 * @apiParam (Query string) {String} [id] ID de la clave específica a obtener.
 *
 * @apiParamExample {json} Request-Example:
 *     GET /api/key?page=2&code=LNEB&desc=main&count=key HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <User_Token>
 *
 * @apiSuccess (200) {Object[]} data Lista de claves o la clave específica.
 * @apiSuccess (200) {String} data.line Código de la línea.
 * @apiSuccess (200) {String} data.brand Código de la marca.
 * @apiSuccess (200) {Date} data.createdAt Fecha de creación.
 * @apiSuccess (200) {Date} data.updatedAt Fecha de actualización.
 * @apiSuccess (200) {Number} [data.count_items] Número de ítems asociados a la clave, si se solicitó.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "code": "LNEBRD",
 *           "desc": "Descripción de llave",
 *           "count_items": 5
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
 *     curl -X GET http://localhost:3000/api/key?page=2&code=LNEB&desc=main&count=key \
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
    const limit = setup.LIMIT.KEY;
    const search = new Aggregate();

    const code = req.query("code");
    if (code) {
      search.match({
        code: {
          $regex: code,
          $options: "i",
        },
      });
    }

    const desc = req.query("desc");
    if (desc) {
      search.match({
        desc: {
          $regex: desc,
          $options: "i",
        },
      });
    }

    const [{ data, totalDocs }] = await KeyModel.getPopulate<AnswerPage>()
      .append(...search.pipeline())
      .sort("code")
      .append(...buildPagePipeline(limit, page));
    if (data.length < 1) throw new NotFoundError("No se encontraron docs");

    const count = req.query("count");
    if (count === "key") {
      for await (const key of data) {
        key.countItems = await ItemModel.countDocuments({ key: key._id });
      }
    }

    return json(formatPage(data, limit, totalDocs, page));
  }

  const _id = req.query("id");
  if (isValidObjectId(_id)) {
    const [data] = await KeyModel.getPopulate(_id);
    if (!data) throw new NotFoundError("No se encontraron líneas");

    const count = req.query("count");
    if (count === "key") {
      data.countItems = await ItemModel.countDocuments({ key: data._id });
    }

    return json({ data });
  }

  const data = await KeyModel.getPopulate();
  if (data.length < 1) throw new NotFoundError("No se encontraron líneas");

  const count = req.query("count");
  if (count === "key") {
    for await (const key of data) {
      key.countItems = await ItemModel.countDocuments({ key: key._id });
    }
  }

  return json({ data });
});
