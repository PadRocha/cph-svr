import type { LeanUser } from "@interfaces/user.interface.ts";
import { BadRequestError, NotFoundError } from "errors";
import { factory } from "factory";
import { UserModel } from "models";

import { intoRoles } from "@utils/roles.ts";

/**
 * @api {get} /api/user Obtener Información de Usuario
 * @apiVersion 1.0.0
 * @apiName ReturnUser
 * @apiGroup User
 * @apiPermission user
 *
 * @apiDescription Este endpoint permite obtener la información de un usuario específico mediante el parámetro `nickname`, o del usuario autenticado que realiza la solicitud si no se proporciona dicho parámetro.
 *
 * @apiUse AuthHeader
 *
 * @apiParam (Query string) {String} [nickname] Nombre de usuario a buscar. Si no se proporciona, se devuelve la información del usuario autenticado.
 *
 * @apiSuccess {String} identifier Identificador único del usuario.
 * @apiSuccess {String} nickname Nombre de usuario.
 * @apiSuccess {Array} roles Arreglo de roles del usuario.
 *
 * @apiSuccessExample {json} Respuesta exitosa (con `nickname`):
 *     HTTP/1.1 200 OK
 *     {
 *       "identifier": "5f47a0b5c6b6e6d1f4a2b317",
 *       "nickname": "usuarioExistente",
 *       "roles": ["ADMIN", "USER"]
 *     }
 *
 * @apiSuccessExample {json} Respuesta exitosa (sin `nickname`):
 *     HTTP/1.1 200 OK
 *     {
 *       "identifier": "5f47a0b5c6b6e6d1f4a2b317",
 *       "nickname": "usuarioAutenticado",
 *       "roles": ["USER"]
 *     }
 *
 * @apiError (400) BadRequest No se enviaron los parámetros necesarios para la solicitud.
 * @apiError (404) NotFound No se encontró el usuario solicitado.
 * @apiError (500) InternalServerError Error interno al procesar la solicitud.
 *
 * @apiErrorExample {json} Respuesta de error 400:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "No se enviaron los parámetros necesarios para la solicitud"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 404:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "No se encontró el usuario solicitado"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 500:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Error interno al procesar la solicitud"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso con `nickname`:
 *     curl -X GET http://localhost:5885/api/user?nickname=usuarioExistente \
 *     -H "Authorization: Bearer <User_Token>"
 *
 * @apiExample {curl} Ejemplo de uso sin `nickname`:
 *     curl -X GET http://localhost:5885/api/user \
 *     -H "Authorization: Bearer <User_Token>"
 */
export default factory.createHandlers(async ({ get, req, json }) => {
  const user = get("user");
  const nickname = req.query("nickname");

  if (!nickname && !user) {
    throw new BadRequestError(
      "No se enviaron los parámetros necesarios para la solicitud",
    );
  }

  if (nickname) {
    const data = await UserModel.findOne({ nickname });

    if (!data) throw new NotFoundError("No se encontró el usuario solicitado");

    const { _id: identifier, nickname: userNickname, role } = data;
    const roles = intoRoles(role);
    return json({ identifier, nickname: userNickname, roles });
  }

  if (user) {
    const {
      _id: identifier,
      nickname: userNickname,
      role,
    } = user.toObject<LeanUser>();
    const roles = intoRoles(role);
    return json({ identifier, nickname: userNickname, roles });
  }
});
