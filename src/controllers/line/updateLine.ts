import type { LeanLine } from "@interfaces/line.interface.ts";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { LineModel } from "models";

/**
 * @api {put} /api/brand Actualizar Marca
 * @apiVersion 1.0.0
 * @apiName UpdateBrand
 * @apiGroup Brand
 * @apiPermission admin
 *
 * @apiDescription Este método actualiza una marca existente en el sistema. Solo puede ser ejecutado por usuarios con roles 'EDIT', 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} id Identificador único de la marca a actualizar.
 * @apiParam (Request body) {String} code Código único de la marca.
 * @apiParam (Request body) {String} desc Descripción de la marca.
 *
 * @apiParamExample {json} Request-Example:
 *     PUT /api/brand?id=5f47a7b85c2a4b001c77995a HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "code": "BRD",
 *       "desc": "Marca actualizada"
 *     }
 *
 * @apiSuccess (200) {Object} data Información de la marca actualizada.
 * @apiSuccess (200) {String} data.code Código de la marca.
 * @apiSuccess (200) {String} data.desc Descripción de la marca.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "BRD",
 *         "desc": "Marca actualizada"
 *       }
 *     }
 *
 * @apiError (400) BadRequest No se enviaron los parámetros necesarios o el ID no es válido.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontró el documento a actualizar.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X PUT http://localhost:3000/api/brand?id=5f47a7b85c2a4b001c77995a \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"code": "BRD", "desc": "Marca actualizada"}'
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const body = await req.json<LeanLine>();
  const data = await LineModel.findOneAndUpdate(
    { _id: req.query("id") },
    body,
    { new: true, fields: { code: 1, desc: 1 } },
  ).lean();
  if (!data) throw new NotFoundError("No se modificó el documento solicitado");

  return json({ data });
});
