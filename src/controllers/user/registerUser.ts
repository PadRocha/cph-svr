import type { LeanUser } from "@interfaces/user.interface.ts";
import { UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { UserModel } from 'models';

import { intoRole } from '@utils/roles.ts';

/**
 * @api {post} /api/register Registrar Usuario
 * @apiVersion 1.0.0
 * @apiName RegisterUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiDescription Este endpoint permite registrar un nuevo usuario en el sistema. Solo los usuarios con el rol de administrador tienen acceso a este recurso.
 *
 * @apiHeader {String} Authorization Token de acceso del administrador, con el prefijo 'Bearer'.
 *
 * @apiParam (Request body) {String} nickname Nombre único del usuario.
 * @apiParam (Request body) {String} password Contraseña del usuario.
 * @apiParam (Request body) {String[]} [roles] Arreglo de roles asignados al usuario. Deben ser válidos.
 *
 * @apiParamExample {json} Ejemplo de solicitud:
 *     POST /api/register HTTP/1.1
 *     Host: localhost:5885
 *     Content-Type: application/json
 *     Authorization: Bearer <Admin_Token>
 *     {
 *       "nickname": "nuevoUsuario",
 *       "password": "contraseñaSegura",
 *       "roles": ["USER"]
 *     }
 *
 * @apiSuccess {String} token Token JWT generado para el usuario recién registrado.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     }
 *
 * @apiError (400) BadRequest La solicitud es inválida. Los parámetros obligatorios no fueron enviados o los roles no son válidos.
 * @apiError (401) Unauthorized El usuario que realiza la solicitud no tiene permisos de administrador.
 * @apiError (204) NoContent Se guardó el usuario, pero no se devolvió ningún contenido debido a un fallo en la operación.
 *
 * @apiErrorExample {json} Respuesta de error 400:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "No se enviaron los parámetros obligatorios"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 401:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "El usuario no tiene permisos de administrador"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 204:
 *     HTTP/1.1 204 No Content
 *     {
 *       "message": "El usuario fue registrado, pero no se devolvió contenido"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X POST http://localhost:5885/api/register \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <Admin_Token>" \
 *     -d '{
 *       "nickname": "nuevoUsuario",
 *       "password": "contraseñaSegura",
 *       "roles": ["USER"]
 *     }'
 */
export default factory.createHandlers(async ({ req, get, body, json }) => {
  if (!get("user").roleIncludes("ADMIN")) {
    throw new UnauthorizedError("El usuario no tiene permisos");
  }

  const userData = await req.json<LeanUser>();
  userData.role = intoRole(userData.roles);

  delete userData.roles;
  const data = await new UserModel(userData).save();
  if (!data) {
    return body(null, 204);
  }

  delete data.password;
  delete data.password_salt;
  return json({ token: await data.createToken() });
});
