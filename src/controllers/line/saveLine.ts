import type { LeanLine } from "@interfaces/line.interface.ts";
import { UnauthorizedError } from "errors";
import { factory } from "factory";
import { LineModel } from "models";

/**
 * @api {post} /api/line Registrar Línea
 * @apiVersion 1.0.0
 * @apiName SaveLine
 * @apiGroup Line
 * @apiPermission admin
 *
 * @apiDescription Este método registra una nueva línea en el sistema. Solo puede ser ejecutado por usuarios con roles 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Request body) {String} code Código único de la línea.
 * @apiParam (Request body) {String} desc Descripción de la línea.
 *
 * @apiParamExample {json} Request-Example:
 *     POST /api/line HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "code": "LNE",
 *       "desc": "Línea de ejemplo"
 *     }
 *
 * @apiSuccess (200) {Object} data Información de la línea registrada.
 * @apiSuccess (200) {String} data.code Código de la línea.
 * @apiSuccess (200) {String} data.desc Descripción de la línea.
 * @apiSuccess (200) {Date} data.createdAt Fecha de creación.
 * @apiSuccess (200) {Date} data.updatedAt Fecha de actualización.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "LNE",
 *         "desc": "Línea de ejemplo"
 *       }
 *     }
 *
 * @apiError (400) BadRequest No se enviaron los parámetros necesarios o hay un error con los parámetros.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (204) NoContent Se guardó la marca pero no se está devolviendo contenido.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X POST http://localhost:3000/api/line \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"code": "LNE", "desc": "Línea de ejemplo"}'
 */
export default factory.createHandlers(async ({ req, get, body, json }) => {
  if (!get("user").roleIncludes("GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const lineData = await req.json<LeanLine>();
  const data = await new LineModel(lineData).save();
  if (!data) {
    return body(null, 204);
  }

  return json({ data });
});
