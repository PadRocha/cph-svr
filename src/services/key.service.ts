import type { PopulatedKey } from "@interfaces/key.interface.ts";
import { pipeline } from "aggregate";
import { Aggregate, isValidObjectId, Types } from "deps";
import { KeyModel } from "models";
import { pattern } from "regex";

import { damerauLevenshteinDistance } from "@utils/levenshteinDistance.ts";

/**
 * Busca una clave por su código y retorna su ObjectId si existe, o `null` en caso contrario.
 *
 * @remarks
 * - Si `code` es un ObjectId válido y existe en la base de datos, se retorna ese ObjectId.
 * - Si `code` es una cadena, se valida que cumpla con el patrón definido en `pattern.KEY`
 *   (sin sensibilidad a mayúsculas/minúsculas) y se ejecuta un pipeline de agregación para
 *   obtener el ObjectId asociado a la clave.
 *
 * @param code - Identificador de la clave, ya sea un `Types.ObjectId` o un string.
 * @returns Una promesa que resuelve con el `Types.ObjectId` de la clave si se encuentra, o `null`.
 *
 * @example
 * ```ts
 * // Ejemplo de uso dentro del modelo KeyModel:
 * const keyId = await KeyModel.findByCode("ABCD");
 * if (keyId) {
 *   console.log("Clave encontrada:", keyId.toString());
 * } else {
 *   console.log("No se encontró la clave.");
 * }
 * ```
 */
export async function findByCode(
  this: KeyModel,
  code?: Types.ObjectId | string,
): Promise<Types.ObjectId | null> {
  if (isValidObjectId(code) && (await this.exists({ _id: code }))) {
    return new Types.ObjectId(code);
  }

  if (typeof code !== "string" || !RegExp(`^${pattern.KEY}$`, "i").test(code)) {
    return null;
  }

  const [doc] = await this.aggregate<PopulatedKey>()
    .lookup(pipeline.LOOKUP.LINE).unwind("$line")
    .lookup(pipeline.LOOKUP.BRAND).unwind("$brand")
    .project({ code: { $concat: ["$line.code", "$brand.code"] } })
    .match({ code: code.toUpperCase() });

  return !doc?._id ? null : new Types.ObjectId(doc._id);
}

/**
 * Crea un pipeline de agregación que popula la información de la clave.
 *
 * @remarks
 * La función genera un pipeline que:
 * - Filtra por `_id` si se proporciona el parámetro `id`.
 * - Realiza lookup y unwind para poblar los campos `line` y `brand`
 *   utilizando las configuraciones definidas en `pipeline.LOOKUP`.
 * - Proyecta los campos de la clave conforme a `pipeline.PROJECT.KEY`.
 * - Ordena los resultados por `code`.
 *
 * @typeParam T - Tipo de los documentos poblados (por defecto `PopulatedKey`).
 * @param id - Opcional. Identificador (_id) para filtrar el pipeline.
 * @returns Una instancia de `Aggregate<T[]>` que, al ejecutarse, devuelve un arreglo de documentos poblados.
 *
 * @example
 * ```ts
 * const populatePipeline = KeyModel.getPopulate<PopulatedKey>("63abf...id");
 * const populatedKeys = await populatePipeline.exec();
 * console.log("Claves pobladas:", populatedKeys);
 * ```
 */
export function getPopulate<T = PopulatedKey>(
  this: KeyModel,
  id?: string,
): Aggregate<T[]> {
  const aggregate = this.aggregate<T>();

  if (id) aggregate.match({ _id: new Types.ObjectId(id) });

  return aggregate
    .lookup(pipeline.LOOKUP.LINE).unwind("$line")
    .lookup(pipeline.LOOKUP.BRAND).unwind("$brand")
    .project(pipeline.PROJECT.KEY)
    .sort("code");
}

/**
 * Ejecuta una búsqueda difusa (fuzzy) sobre las claves utilizando la distancia de Damerau-Levenshtein.
 *
 * @remarks
 * La función crea un pipeline de agregación que:
 * - Realiza lookup y unwind para poblar los campos `line` y `brand`.
 * - Proyecta un campo `code` concatenando `line.code` y `brand.code`.
 * - Agrega un campo `distance` calculado mediante una función en JavaScript
 *   (`damerauLevenshteinDistance`) que compara el campo `code` con el valor proporcionado.
 * - Filtra los documentos para conservar aquellos cuya distancia sea exactamente 1.
 * - Ordena los resultados por `code`.
 *
 * @param key - Cadena de búsqueda para comparar con el campo concatenado `code`.
 * @returns Una instancia de `Aggregate<{ code: string }[]>` que, al ejecutarse,
 * devuelve los documentos cuyo campo `code` tiene una distancia igual a 1 respecto al valor `key`.
 *
 * @example
 * ```ts
 * const fuzzyResults = await KeyModel.getFuzzy("AB").exec();
 * fuzzyResults.forEach(result => {
 *   console.log("Código encontrado:", result.code);
 * });
 * ```
 */
export function getFuzzy(
  this: KeyModel,
  key: string,
): Aggregate<{ code: string }[]> {
  return this.aggregate<{ code: string }>()
    .lookup(pipeline.LOOKUP.LINE).unwind("$line")
    .lookup(pipeline.LOOKUP.BRAND).unwind("$brand")
    .project({ code: { $concat: ["$line.code", "$brand.code"] } })
    .addFields({
      distance: {
        $function: {
          body: damerauLevenshteinDistance,
          args: ["$code", key],
          lang: "js",
        },
      },
    })
    .match({ distance: { $eq: 1 } })
    .sort("code");
}
