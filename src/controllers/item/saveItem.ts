import type { LeanItem } from "@interfaces/item.interface.ts";
import { UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel, KeyModel } from "models";

/**
 * @api {post} /api/item Registrar Item
 * @apiVersion 1.0.0
 * @apiName SaveItem
 * @apiGroup Item
 * @apiPermission admin
 *
 * @apiDescription Este endpoint permite a los usuarios con permisos de 'GRANT' o 'ADMIN' registrar un nuevo item en el sistema.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Request body) {String} key Clave asociada al item.
 * @apiParam (Request body) {String} code Código del item.
 * @apiParam (Request body) {String} desc Descripción del item.
 * @apiParam (Request body) {Number} [status] Estado opcional para las imágenes (0-4).
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "key": "LNEBRD",
 *       "code": "0001",
 *       "desc": "Descripción del item",
 *       "status": 2
 *     }
 *
 * @apiSuccess (200) {Object} data Objeto que contiene la información del item registrado.
 * @apiSuccess (200) {String} data.key Clave asociada al item.
 * @apiSuccess (200) {String} data.code Código del item.
 * @apiSuccess (200) {String} data.desc Descripción del item.
 * @apiSuccess (200) {Object[]} data.images Imágenes asociadas al item.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "key": "LNEBRD",
 *         "code": "0001",
 *         "desc": "Descripción del item",
 *         "images": [
 *           {
 *             "idN": 1,
 *             "status": 2
 *           },
 *           {
 *             "idN": 2,
 *             "status": 2
 *           },
 *           {
 *             "idN": 3,
 *             "status": 2
 *           }
 *         ]
 *       }
 *     }
 *
 * @apiError (400) BadRequest Parámetros no enviados o inválidos.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (204) NoContent Guardado pero no devuelve contenido.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Locked
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X POST http://localhost:3000/api/item \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"key": "LNEBRD", "code": "0001", "desc": "Descripción del item", "status": 2}'
 */
export default factory.createHandlers(async ({ req, get, body, json }) => {
  if (!get("user").roleIncludes("GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const itemData = await req.json<LeanItem & { status: number }>();
  if (!isNaN(itemData.status) && itemData.status >= 0 && itemData.status < 5) {
    itemData.images = Array.from({ length: 3 }, (_, n) => ({
      idN: n + 1,
      status: itemData.status,
    }));
  }

  const data = await new ItemModel({
    key: await KeyModel.findByCode(itemData.key),
    ...itemData,
  }).save();
  if (!data) {
    return body(null, 204);
  }

  return json({ data });
});
