import type { LeanLine } from "@interfaces/line.interface.ts";
import { isValidObjectId, Types } from "deps";
import { LineModel } from "models";
import { pattern } from "regex";

/**
 * Busca una línea por su código y retorna su ObjectId si se encuentra, o `null` en caso contrario.
 *
 * @remarks
 * Esta función se utiliza como método estático en el modelo `LineModel` para localizar
 * un documento de línea mediante su campo `code`. Si el parámetro `code` es un ObjectId válido
 * y existe en la colección, se retorna ese ObjectId. Si se pasa un string, se valida que cumpla
 * con el patrón definido en `pattern.LINE` (sin distinguir mayúsculas/minúsculas). En ese caso,
 * se ejecuta un pipeline de agregación para obtener el ObjectId asociado.
 *
 * @param code - El identificador de la línea, ya sea un `Types.ObjectId` o un string.
 * @returns Una promesa que resuelve con el `Types.ObjectId` de la línea encontrada o `null` si no se encuentra.
 *
 * @example
 * ```ts
 * // Uso en el contexto del modelo LineModel:
 * const lineId = await LineModel.findByCode("ABC");
 * if (lineId) {
 *   console.log("Línea encontrada:", lineId.toString());
 * } else {
 *   console.log("No se encontró la línea con el código 'ABC'");
 * }
 * ```
 */
export async function findByCode(
  this: LineModel,
  code?: Types.ObjectId | string,
): Promise<Types.ObjectId | null> {
  if (isValidObjectId(code) && (await this.exists({ _id: code }))) {
    return new Types.ObjectId(code);
  }

  if (
    typeof code !== "string" || !RegExp(`^${pattern.LINE}$`, "i").test(code)
  ) {
    return null;
  }

  const [doc] = await this.aggregate<LeanLine>()
    .match({ code: code.toUpperCase() })
    .project({ _id: 1 });

  return !doc?._id ? null : new Types.ObjectId(doc._id);
}
