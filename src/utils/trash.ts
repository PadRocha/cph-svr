import { existsSync, resolve } from "deps";

import { formatDateTime } from "@utils/formatDate.ts";

/**
 * Mueve uno o más archivos a la papelera ("trash") de forma segura.
 *
 * @remarks
 * Esta función verifica si cada archivo existe en la ubicación especificada y, de ser así,
 * lo mueve a la carpeta "trash". El nuevo nombre del archivo se genera concatenando el prefijo
 * "deleted-", la fecha y hora actual (formateada con `formatDateTime()`) y el nombre original del archivo.
 *
 * @param location - Ruta base donde se ubican los archivos.
 * @param key - Clave que identifica la subcarpeta dentro de "assets" de donde se moverán los archivos.
 * @param files - Uno o más nombres de archivo que se desean mover. Puede ser un string o un arreglo de strings.
 *
 * @example
 * ```ts
 * // Mover un solo archivo:
 * moveFilesToTrash("/home/user/project", "images", "photo.jpg");
 *
 * // Mover múltiples archivos:
 * moveFilesToTrash("/home/user/project", "documents", ["file1.txt", "file2.txt"]);
 * ```
 */
export function moveFilesToTrash(
  location: string,
  key: string,
  files: string | string[],
): void {
  const files_list = Array.isArray(files) ? files : [files];
  for (const file of files_list) {
    const path = resolve(location, "assets", key, file);
    if (!existsSync(path)) continue;
    const new_path = resolve(
      location,
      "trash",
      `deleted-${formatDateTime()}-${file}`,
    );
    Deno.renameSync(path, new_path);
  }
}

/**
 * Elimina archivos de forma segura, verificando su existencia antes de borrarlos.
 *
 * @remarks
 * Para cada archivo en el arreglo `files`, se construye la ruta absoluta utilizando
 * la ubicación base proporcionada. Si el archivo existe en esa ruta, se elimina
 * utilizando `Deno.removeSync()`.
 *
 * @param location - Ruta base donde se encuentran los archivos a eliminar.
 * @param files - Arreglo de nombres de archivo que se desean eliminar.
 *
 * @example
 * ```ts
 * // Eliminar archivos de la carpeta "/home/user/project"
 * deleteFilesSafely("/home/user/project", ["old_file.txt", "unused_image.png"]);
 * ```
 */
export function deleteFilesSafely(location: string, files: string[]): void {
  for (const file of files) {
    const path = resolve(location, file);
    if (existsSync(path)) {
      Deno.removeSync(path);
    }
  }
}
