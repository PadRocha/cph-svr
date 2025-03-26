import type { LeanBrand } from "@interfaces/brand.interface.ts";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel } from "models";

/**
 * @api {put} /api/brand Actualizar Marca
 * @apiVersion 1.0.0
 * @apiName UpdateBrand
 * @apiGroup Brand
 * @apiPermission admin
 *
 * @apiDescription Este endpoint actualiza una marca existente en el sistema. Solo puede ser ejecutado por usuarios con roles 'EDIT', 'GRANT' o 'ADMIN'.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} id Identificador único de la marca a actualizar.
 * @apiParam (Request body) {String} [code] Código único de la marca.
 * @apiParam (Request body) {String} [desc] Descripción de la marca.
 *
 * @apiParamExample {json} Ejemplo de solicitud:
 *     PUT /api/brand?id=5f47a7b85c2a4b001c77995a HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "code": "BRD",
 *       "desc": "Marca actualizada"
 *     }
 *
 * @apiSuccess {Object} data Información de la marca actualizada.
 * @apiSuccess {String} data.code Código de la marca.
 * @apiSuccess {String} data.desc Descripción de la marca.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
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
 *       "message": "No se encontró la marca solicitada"
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

  const _id = req.query("id");
  const body = await req.json<LeanBrand>();
  const data = await BrandModel.findOneAndUpdate({ _id }, body, {
    new: true,
    fields: { code: 1, desc: 1 },
  }).lean();
  if (!data) throw new NotFoundError("No se encontró la marca solicitada");

  return json({ data });
});
