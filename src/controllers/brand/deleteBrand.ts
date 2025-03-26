import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { BrandModel, ItemModel, KeyModel } from "models";

import { moveFilesToTrash } from "@utils/trash.ts";

/**
 * @api {delete} /api/brand Eliminar Marca
 * @apiVersion 1.0.0
 * @apiName DeleteBrand
 * @apiGroup Brand
 * @apiPermission admin
 *
 * @apiDescription Este método elimina una marca del sistema y opcionalmente sus archivos relacionados. Solo puede ser ejecutado por usuarios con rol 'ADMIN'. El middleware `pathFile` se utiliza para manejar las rutas de los archivos asociados a la marca.
 *
 * @apiUse AuthHeader
 * @apiUse PathFileHeader
 *
 * @apiParam (Query string) {String} id Identificador único de la marca a eliminar.
 * @apiParam (Query string) {String} [force] Opción para forzar la eliminación de la marca y sus archivos relacionados.
 *
 * @apiParamExample {json} Request-Example:
 *     DELETE /api/brand?id=5f47a7b85c2a4b001c77995a&force=delete HTTP/1.1
 *     Host: localhost:3000
 *     Authorization: Bearer <Admin_Token>
 *     location: /ruta/personalizada/al/directorio
 *
 * @apiSuccess (200) {Object} data Información de la marca eliminada.
 * @apiSuccess (200) {String} data.code Código de la marca.
 * @apiSuccess (200) {String} data.desc Descripción de la marca.
 * @apiSuccess (200) {Object} deletedStatus Estado de los elementos relacionados eliminados, si se aplicó la opción 'force'.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "code": "BRD",
 *         "desc": "Marca eliminada"
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
 * @apiError (400) BadRequest No se envió el ID o el ID no es válido.
 * @apiError (403) Forbidden Acceso denegado por falta de permisos.
 * @apiError (404) NotFound No se encontró el documento a eliminar.
 * @apiError (409) Conflict Error interno, probablemente relacionado con los parámetros.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "message": "Access denied"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X DELETE http://localhost:3000/api/brand?id=5f47a7b85c2a4b001c77995a&force=delete \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -H "location: /ruta/personalizada/al/directorio"
 */
export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) throw new UnauthorizedError();

  const _id = req.query("id");
  const data = await BrandModel.findOne({ _id }).select("code desc");
  if (!data) throw new NotFoundError("Documento no encontrado");

  const data_file = await ItemModel.getBackInfo("key.brand._id", _id!);
  const { deletedCount } = await BrandModel.deleteOne({ _id });
  if (!deletedCount) throw new NotFoundError("Documento no encontrado");

  const location = get("location");
  const force = req.query("force");
  if (location && force === "delete") {
    for (const { _id: key, code, files } of data_file?.images) {
      const key_deleted = await KeyModel.deleteOne({ _id: key });
      if (!key_deleted.deletedCount) continue;

      const items_deleted = await ItemModel.deleteMany({ key });
      if (!items_deleted.deletedCount) continue;

      moveFilesToTrash(location, code, files);
    }

    return json({ data, deletedStatus: data_file.status });
  }

  return json({ data });
});
