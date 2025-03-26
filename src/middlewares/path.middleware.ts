import { existsSync, join, resolve } from "deps";
import { homedir } from "node:os";

import { createMiddleware as factory } from "@hono/hono/factory";

/**
 * @apiDefine PathFileHeader
 *
 * @apiHeader {String} [location] Ruta personalizada para la ubicación de los archivos.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "location": "/ruta/personalizada/al/directorio"
 *     }
 */

/**
 * @api {middleware} pathFile Crear Estructura de Directorios
 * @apiVersion 1.0.0
 * @apiName PathFile
 * @apiGroup Middleware
 *
 * @apiDescription Este middleware crea una estructura de directorios 'catalogo-roca' en la ubicación especificada en el encabezado 'location' de la solicitud, o en una ubicación predeterminada si no se proporciona ninguna. Dentro de 'catalogo-roca', se crean los subdirectorios 'assets' y 'trash'.
 *
 * @apiUse PathFileHeader
 *
 * @apiError (400) BadRequest No se proporcionó la ubicación en el encabezado de la solicitud.
 * @apiError (500) InternalServerError Error al crear la estructura de directorios.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "Location header is missing"
 *     }
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Could not create directory structure"
 *     }
 *
 * @apiExample {typescript} Ejemplo de uso:
 *     import { Hono } from "hono";
 *     import { pathFile } from "./middlewares/path.ts";
 *
 *     const app = new Hono();
 *
 *     app.use('/api/brand', pathFile);
 *     app.get('/api/brand', (c) => {
 *       const location = c.get('location');
 *       return c.text(`Estructura de directorios creada en: ${location}`);
 *     });
 */
export const pathMiddleware = factory(async ({ req, set }, next) => {
  const folders = ["assets", "trash"];
  let location = req.header("location");

  if (location && existsSync(location)) {
    location = resolve(location, "catalogo-roca");
    for (const folder of folders) {
      const path = join(location, folder);
      if (!existsSync(path)) Deno.mkdirSync(path, { recursive: true });
    }
    set("location", location);
    return await next();
  }

  for (const dir of ["Pictures", "Images", "Imágenes", "Desktop"]) {
    const directory = resolve(homedir(), dir);
    if (!existsSync(directory)) continue;

    location = resolve(directory, "catalogo-roca");
    for (const folder of folders) {
      const path = join(location, folder);
      if (!existsSync(path)) Deno.mkdirSync(path, { recursive: true });
    }
    set("location", location);
    return await next();
  }

  location = resolve(homedir(), "Pictures", "catalogo-roca");
  for (const folder of folders) {
    const path = join(location, folder);
    if (!existsSync(path)) Deno.mkdirSync(path, { recursive: true });
  }
  set("location", location);
  await next();
});
