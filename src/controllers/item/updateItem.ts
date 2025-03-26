import type { LeanItem } from "@interfaces/item.interface.ts";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel, KeyModel } from "models";

/**
 * @api {put} /api/item Actualizar Item
 * @apiVersion 1.0.0
 * @apiName UpdateItem
 * @apiGroup Item
 * @apiPermission admin
 *
 * @apiDescription Este método actualiza la información de un item existente en el sistema. Solo puede ser ejecutado por usuarios con roles 'EDIT', 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} id ID único del item a actualizar.
 * @apiParam (Request body) {String} [key] Clave asociada al item.
 * @apiParam (Request body) {String} [code] Código del item.
 * @apiParam (Request body) {String} [desc] Descripción del item.
 * @apiParam (Request body) {Object[]} [images] Imágenes asociadas al item.
 *
 * @apiParamExample {json} Request-Example:
 *     PUT /api/item?id=5f4471326b54a216c46f1a6e HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "key": "LNEORD",
 *       "code": "0001",
 *       "desc": "Descripción actualizada del item"
 *     }
 *
 * @apiSuccess (200) {Object} data Objeto que contiene la información del item actualizado.
 * @apiSuccess (200) {String} data.code Código del item.
 * @apiSuccess (200) {String} data.desc Descripción del item.
 * @apiSuccess (200) {Object[]} data.images Imágenes asociadas al item.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "LNEBRD0001",
 *         "desc": "Descripción actualizada del item",
 *         "images": [
 *           {
 *             "idN": 1,
 *             "status": 3
 *           }
 *         ]
 *       }
 *     }
 *
 * @apiError (400) BadRequest Parámetros no enviados o inválidos.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontró el documento solicitado.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Locked
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X PUT http://localhost:3000/api/item?id=5f4471326b54a216c46f1a6e \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"key": "LNEORD", "code": "0001", "desc": "Descripción actualizada del item" }'
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id");
  const [data] = await ItemModel.getPopulate(_id);
  if (!data) throw new NotFoundError("No se encontró el documento solicitado");

  const body = await req.json<LeanItem>();
  const { modifiedCount } = await ItemModel.updateOne(
    { _id },
    {
      key: await KeyModel.findByCode(body.key),
      ...body,
    },
  );
  if (!modifiedCount) throw new NotFoundError("Documento no modificado");

  return json({ data });
});
