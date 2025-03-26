import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel, KeyModel } from 'models';

import { moveFilesToTrash } from '@utils/trash.ts';

/**
 * @api {delete} /api/key Eliminar Clave
 * @apiVersion 1.0.0
 * @apiName DeleteKey
 * @apiGroup Key
 * @apiPermission admin
 *
 * @apiDescription Este método elimina una clave específica del sistema. Solo puede ser ejecutado por usuarios con rol 'ADMIN'. Si se proporciona el parámetro 'force' con el valor 'delete', se eliminarán todos los archivos relacionados de forma permanente.
 *
 * @apiUse AuthHeader
 * @apiUse PathFileHeader
 *
 * @apiParam (Query string) {String} id ID único de la clave a eliminar.
 * @apiParam (Query string) {String} [force] Opción para eliminar todos los archivos relacionados ('delete').
 *
 * @apiParamExample {json} Request-Example:
 *     DELETE /api/key?id=5f4471326b54a216c46f1a6e&force=delete HTTP/1.1
 *     Host: localhost:3000
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     location: /ruta/personalizada/al/directorio
 *
 * @apiSuccess (200) {Object} data Información de la clave eliminada.
 * @apiSuccess (200) {String} data.line Código de la línea.
 * @apiSuccess (200) {String} data.brand Código de la marca.
 * @apiSuccess (200) {Object} deletedStatus Estado de los elementos eliminados.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "LNEBRD",
 *         "desc": "Descripción de llave",
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
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X DELETE http://localhost:3000/api/key?id=5f4471326b54a216c46f1a6e&force=delete \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -H "location: /ruta/personalizada/al/directorio"
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id");
  const [data] = await KeyModel.getPopulate(_id);
  if (!data) throw new NotFoundError("Documento no encontrado");

  const data_file = await ItemModel.getBackInfo("key._id", _id!);
  const { deletedCount } = await KeyModel.deleteOne({ _id });
  if (!deletedCount) throw new NotFoundError("Documento no encontrado");

  const location = get("location");
  const force = req.query("force");
  if (location && force === "delete") {
    for (const { _id: key, code, files } of data_file?.images) {
      const items_deleted = await ItemModel.deleteMany({ key });
      if (!items_deleted.deletedCount) continue;

      moveFilesToTrash(location, code, files);
    }

    return json({ data, deletedStatus: data_file.status });
  }

  return json({ data });
});
