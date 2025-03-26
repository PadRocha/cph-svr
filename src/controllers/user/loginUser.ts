import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { UserModel } from "models";

/**
 * @api {post} /api/login Iniciar Sesión de Usuario
 * @apiVersion 1.0.0
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiDescription Este endpoint permite a un usuario autenticarse en el sistema proporcionando su nombre de usuario y contraseña válidos. Si las credenciales son correctas, se genera un token JWT para el usuario.
 *
 * @apiParam (Request body) {String} nickname Nombre de usuario.
 * @apiParam (Request body) {String} password Contraseña del usuario.
 *
 * @apiParamExample {json} Ejemplo de solicitud:
 *     POST /api/login HTTP/1.1
 *     Host: localhost:5885
 *     Content-Type: application/json
 *     {
 *       "nickname": "usuarioExistente",
 *       "password": "contraseñaSegura"
 *     }
 *
 * @apiSuccess {String} token Token JWT generado para el usuario autenticado.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     }
 *
 * @apiError (400) BadRequest Los parámetros obligatorios no fueron proporcionados en la solicitud.
 * @apiError (404) NotFound El usuario no existe en el sistema.
 * @apiError (401) Unauthorized La contraseña proporcionada es incorrecta.
 *
 * @apiErrorExample {json} Respuesta de error 400:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "No se enviaron los parámetros obligatorios"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 404:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "El usuario no existe en el sistema"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 401:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Credenciales incorrectas, acceso denegado"
 *     }
 *
 * @apiExample {curl} Ejemplo de uso:
 *     curl -X POST http://localhost:5885/api/login \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "nickname": "usuarioExistente",
 *       "password": "contraseñaSegura"
 *     }'
 */
export default factory.createHandlers(async ({ req, json }) => {
  const body = await req.json<{ nickname?: string; password?: string }>();

  const user = await UserModel
    .findOne({ nickname: body.nickname })
    .select("nickname role password password_salt");
  if (!user) throw new NotFoundError("El usuario no existe en el sistema");

  if (!await user.comparePassword(body.password)) {
    throw new UnauthorizedError("Credenciales incorrectas, acceso denegado");
  }

  return json({ token: await user.createToken() });
});
