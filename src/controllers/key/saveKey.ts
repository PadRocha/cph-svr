import type { LeanKey } from "@interfaces/key.interface.ts";
import { UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel, KeyModel, LineModel } from "models";

/**
 * @api {post} /api/key Registrar Clave
 * @apiVersion 1.0.0
 * @apiName SaveKey
 * @apiGroup Key
 * @apiPermission admin
 *
 * @apiDescription Este endpoint permite a los usuarios con permisos de 'GRANT' o 'ADMIN' registrar una nueva clave en el sistema.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Request body) {String} line Código de la línea asociada a la clave.
 * @apiParam (Request body) {String} brand Código de la marca asociada a la clave.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "line": "LNE",
 *       "brand": "BRD"
 *     }
 *
 * @apiSuccess (200) {Object} data Objeto que contiene la información de la clave registrada.
 * @apiSuccess (200) {String} data.line Código de la línea.
 * @apiSuccess (200) {String} data.brand Código de la marca.
 * @apiSuccess (200) {Date} data.createdAt Fecha de creación de la clave.
 * @apiSuccess (200) {Date} data.updatedAt Fecha de última actualización de la clave.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "line": "LNE",
 *         "brand": "BRD"
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
 *     curl -X POST http://localhost:3000/api/key \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"line": "LNE", "brand": "BRD"}'
 */
export default factory.createHandlers(async ({ req, get, body, json }) => {
  if (!get("user").roleIncludes("GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const keyData = await req.json<LeanKey>();
  const data = await new KeyModel({
    line: await LineModel.findByCode(keyData.line),
    brand: await BrandModel.findByCode(keyData.brand),
  }).save();
  if (!data) {
    return body(null, 204);
  }

  return json({ data });
});
