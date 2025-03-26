import type { LeanKey } from "@interfaces/key.interface.ts";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel, KeyModel, LineModel } from "models";

/**
 * @api {put} /api/key Actualizar Clave
 * @apiVersion 1.0.0
 * @apiName UpdateKey
 * @apiGroup Key
 * @apiPermission admin
 *
 * @apiDescription Este método actualiza la información de una clave existente en el sistema, retorna la clave anterior. Solo puede ser ejecutado por usuarios con roles 'EDIT', 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} id ID único de la clave a actualizar.
 * @apiParam (Request body) {String} [line] Código de la línea asociada a la clave.
 * @apiParam (Request body) {String} [brand] Código de la marca asociada a la clave.
 *
 * @apiParamExample {json} Request-Example:
 *     PUT /api/key?id=5f4471326b54a216c46f1a6e HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "line": "LNE",
 *       "brand": "ORD"
 *     }
 *
 * @apiSuccess (200) {Object} data Información de la clave actualizada.
 * @apiSuccess (200) {String} data.line Código de la línea.
 * @apiSuccess (200) {String} data.brand Código de la marca.
 * @apiSuccess (200) {Date} data.createdAt Fecha de creación.
 * @apiSuccess (200) {Date} data.updatedAt Fecha de actualización.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "LNEBRD",
 *         "desc": "Descripción de llave"
 *       }
 *     }
 *
 * @apiError (400) BadRequest Parámetros no enviados o inválidos.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontró el documento solicitado.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X PUT http://localhost:3000/api/key?id=5f4471326b54a216c46f1a6e \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"line": "LNE", "brand": "ORD"}'
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id");
  const [data] = await KeyModel.getPopulate(_id);
  if (!data) throw new NotFoundError("Documento no encontrado");

  const body = await req.json<LeanKey>();
  const { modifiedCount } = await KeyModel.updateOne(
    { _id },
    {
      line: await LineModel.findByCode(body.line),
      brand: await BrandModel.findByCode(body.brand),
    },
  );
  if (!modifiedCount) throw new NotFoundError("Documento no modificado");

  return json({ data });
});
