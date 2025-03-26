import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel } from "models";

import { moveFilesToTrash } from "@utils/trash.ts";

/**
 * @api {put} /api/key/reset Restablecer Clave
 * @apiVersion 1.0.0
 * @apiName ResetKey
 * @apiGroup Key
 * @apiPermission admin
 *
 * @apiDescription Este método restablece el estado de los archivos asociados a una clave en el sistema. Solo puede ser ejecutado por usuarios con rol 'ADMIN'. El estado se restablece según el valor proporcionado en el cuerpo de la solicitud.
 *
 * @apiUse AuthHeader
 * @apiUse PathFileHeader
 *
 * @apiParam (Query string) {String} id ID único de la clave a restablecer.
 * @apiParam (Request body) {Number} [status] Estado al que se restablecerán los archivos (0-4).
 *
 * @apiParamExample {json} Request-Example:
 *     PUT /api/key/reset?id=5f4471326b54a216c46f1a6e HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     location: /ruta/personalizada/al/directorio
 *     {
 *       "status": 2
 *     }
 *
 * @apiSuccess (200) {Object} data Estado de los elementos restablecidos.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "defective": 0,
 *         "found": 0,
 *         "photographed": 0,
 *         "prepared": 0,
 *         "edited": 0,
 *         "saved": 0
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
 *     curl -X PUT http://localhost:3000/api/key/reset?id=5f4471326b54a216c46f1a6e \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -H "location: /ruta/personalizada/al/directorio" \
 *     -d '{"status": 2}'
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) {
    throw new UnauthorizedError();
  }

  const location = get("location");
  const _id = req.query("id")!;
  const data_file = await ItemModel.getBackInfo("key._id", _id);
  const status = Number(req.query("status"));
  const length = !isNaN(status) && status >= 0 && status < 5 ? 3 : 0;
  const { modifiedCount } = await ItemModel.updateMany(
    { key: _id, images: { $gt: [] } },
    {
      $set: {
        images: Array.from({ length }, (_, n) => ({ idN: n + 1, status })),
      },
    },
  );
  if (!modifiedCount) throw new NotFoundError("Documento no encontrado");

  for (const { code, files } of data_file?.images) {
    moveFilesToTrash(location, code, files);
  }

  return json({ data: data_file.status });
});
