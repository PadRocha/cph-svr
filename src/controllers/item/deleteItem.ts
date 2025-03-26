import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { moveFilesToTrash } from '@utils/trash.ts';

/**
 * @api {delete} /api/item Eliminar Item
 * @apiVersion 1.0.0
 * @apiName DeleteItem
 * @apiGroup Item
 * @apiPermission admin
 *
 * @apiDescription Este método elimina un item específico del sistema. Solo puede ser ejecutado por usuarios con rol 'ADMIN'.
 *
 * @apiUse AuthHeader
 * @apiUse PathFileHeader
 *
 * @apiParam (Query string) {String} id ID único del item a eliminar.
 *
 * @apiParamExample {json} Request-Example:
 *     DELETE /api/item?id=5f4471326b54a216c46f1a6e HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     location: /ruta/personalizada/al/directorio
 *
 * @apiSuccess (200) {Object} data Información del item eliminado.
 * @apiSuccess (200) {Object} deletedStatus Estado de los elementos eliminados.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "LNEBRD0001",
 *         "desc": "Descripción del item",
 *         "images": [
 *           {
 *             "idN": 1,
 *             "status": 2
 *           }
 *         ]
 *       },
 *       "deletedStatus": {
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
 *     HTTP/1.1 403 Locked
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X DELETE http://localhost:3000/api/item?id=5f4471326b54a216c46f1a6e \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -H "location: /ruta/personalizada/al/directorio"
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id");
  const [data] = await ItemModel.getPopulate(_id);
  if (!data) throw new NotFoundError("Documento no encontrado");

  const backup = await ItemModel.getBackInfo("_id", _id!);
  const { deletedCount } = await ItemModel.deleteOne({ _id });
  if (!deletedCount) throw new NotFoundError("Documento no encontrado");

  const location = get("location");
  if (location) {
    for (const { code, files } of backup?.images) {
      moveFilesToTrash(location, code, files);
    }

    return json({ data, deletedStatus: backup.status });
  }

  return json({ data });
});
