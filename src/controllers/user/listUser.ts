import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { UserModel } from 'models';

import { intoRoles } from '@utils/roles.ts';

/**
 * @api {get} /api/user/all Listar Usuarios
 * @apiVersion 1.0.0
 * @apiName ListUsers
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiDescription Este endpoint lista todos los usuarios registrados en el sistema. Solo los usuarios con permisos de administrador pueden acceder a este recurso.
 *
 * @apiUse AuthHeader
 *
 * @apiSuccess {Object[]} data Lista de usuarios.
 * @apiSuccess {String} data.identifier Identificador único del usuario.
 * @apiSuccess {String} data.nickname Nombre de usuario.
 * @apiSuccess {Array} data.roles Arreglo de roles del usuario.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "identifier": "5f47a0b5c6b6e6d1f4a2b317",
 *           "nickname": "usuarioExistente",
 *           "roles": ["ADMIN", "USER"]
 *         },
 *         ...
 *       ]
 *     }
 *
 * @apiError (401) Unauthorized Acceso denegado porque el usuario no tiene permisos de administrador.
 * @apiError (404) NotFound No se encontraron usuarios registrados en el sistema.
 *
 * @apiErrorExample {json} Respuesta de error 401:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Acceso denegado: el usuario no tiene permisos de administrador"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 404:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "No se encontraron usuarios registrados en el sistema"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X GET http://localhost:5885/api/user/all \
 *     -H "Authorization: Bearer <Admin_Token>"
 */
export default factory.createHandlers(async ({ get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) {
    throw new UnauthorizedError();
  }

  const data = await UserModel.find();
  if (!data.length) throw new NotFoundError("No se encontró el documento");

  return json({
    data: data.map(({ _id: identifier, nickname, role }) => ({
      identifier,
      nickname,
      roles: intoRoles(role),
    })),
  });
});
