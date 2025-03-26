import type { LeanBrand } from "@interfaces/brand.interface.ts";
import { UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel } from "models";

/**
 * @api {post} /api/brand Registrar Marca
 * @apiVersion 1.0.0
 * @apiName SaveBrand
 * @apiGroup Brand
 * @apiPermission admin
 *
 * @apiDescription Este endpoint permite registrar una nueva marca en el sistema. Solo los usuarios con roles 'GRANT' o 'ADMIN' tienen acceso a este recurso.
 *
 * @apiHeader {String} Authorization Token de acceso del usuario con el prefijo 'Bearer'.
 *
 * @apiParam (Request body) {String} code Código único de la marca.
 * @apiParam (Request body) {String} desc Descripción de la marca.
 *
 * @apiParamExample {json} Ejemplo de solicitud:
 *     POST /api/brand HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "code": "BRD",
 *       "desc": "Marca de ejemplo"
 *     }
 *
 * @apiSuccess {Object} data Información de la marca registrada.
 * @apiSuccess {String} data.code Código de la marca.
 * @apiSuccess {String} data.desc Descripción de la marca.
 * @apiSuccess {Date} data.createdAt Fecha de creación.
 * @apiSuccess {Date} data.updatedAt Fecha de actualización.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "BRD",
 *         "desc": "Marca de ejemplo"
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
 *       "message": ()
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X POST http://localhost:3000/api/brand \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{"code": "BRD", "desc": "Marca de ejemplo"}'
 */
export default factory.createHandlers(async ({ req, get, body, json }) => {
  if (!get("user").roleIncludes("GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const brandData = await req.json<LeanBrand>();
  const data = await new BrandModel(brandData).save();
  if (!data) {
    return body(null, 204);
  }

  return json({ data });
});
