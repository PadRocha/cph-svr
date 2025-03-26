import { setup } from 'config';
import { BadRequestError, UnauthorizedError } from 'errors';
import { jwtVerify } from 'jose';
import { UserModel } from 'models';

import { createMiddleware as factory } from '@hono/hono/factory';

/**
 * @apiDefine AuthHeader
 *
 * @apiHeader {String} Authorization Token de acceso del usuario, que debe incluir el prefijo 'Bearer'.
 *
 * @apiHeaderExample {json} Ejemplo de encabezado:
 *     {
 *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     }
 */

/**
 * @api {middleware} authMiddleware Verificar y Autorizar Token de Usuario
 * @apiVersion 1.0.0
 * @apiName AuthMiddleware
 * @apiGroup Middleware
 *
 * @apiDescription Middleware encargado de verificar la validez del token JWT proporcionado en el encabezado de la solicitud. Si el token es válido, se autoriza al usuario para acceder a los recursos protegidos.
 * El token también se usa para identificar al usuario y validar sus permisos.
 *
 * @apiUse AuthHeader
 *
 * @apiError (400) BadRequest No se proporcionó un token válido en el encabezado de la solicitud.
 * @apiError (401) Unauthorized El token es inválido, ha expirado o el usuario no tiene permisos suficientes.
 *
 * @apiErrorExample {json} Respuesta de error 400:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "No se ha enviado el token en el encabezado"
 *     }
 *
 * @apiErrorExample {json} Respuesta de error 401:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Token inválido o permisos insuficientes"
 *     }
 *
 * @apiExample {typescript} Ejemplo de implementación:
 *     import express from 'express';
 *     import { authMiddleware } from './middlewares/auth';
 *
 *     const app = express();
 *
 *     app.get('/api/protected-route', authMiddleware, (req, res) => {
 *       res.send('Acceso concedido a la ruta protegida');
 *     });
 */
export const authMiddleware = factory(async ({ req, set }, next) => {
  const authorization = req.header("Authorization");

  const tokenMatch = authorization?.match(/^Bearer\s+([\w.-]+)/);

  if (!tokenMatch) {
    throw new BadRequestError("No se ha enviado el token en el encabezado");
  }

  const [, token] = tokenMatch;

  if (!token) {
    throw new UnauthorizedError(
      "El usuario no tiene las credenciales necesarias para acceder",
    );
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(setup.KEY.SECRET),
  );
  const user = await UserModel.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedError("El usuario no existe en el sistema");
  }

  // Validar que la información del token coincide con el usuario
  if (
    user.role !== payload.role ||
    user._id.toString() != payload.sub ||
    (payload.exp && payload.exp <= Math.floor(Date.now() / 1000))
  ) {
    throw new UnauthorizedError(
      "Acceso denegado: El token es inválido o ha expirado",
    );
  }

  // Añadir el usuario autenticado al contexto para uso en rutas
  set("user", user);

  await next();
});
