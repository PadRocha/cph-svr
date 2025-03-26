import type {
  DeletedInfo,
  LeanItem,
  PopulatedItem,
} from "@interfaces/item.interface.ts";
import { pipeline } from "aggregate";
import { Aggregate, isValidObjectId, Types } from "deps";
import { ItemModel } from "models";
import { pattern } from "regex";

import { damerauLevenshteinDistance } from "@utils/levenshteinDistance.ts";

/**
 * Busca un ítem en la colección utilizando su código.
 *
 * @remarks
 * Si el parámetro `code` es un ObjectId válido y existe en la colección, se retorna ese ObjectId.
 * Si es un string, se valida que cumpla con el patrón definido en `pattern.ITEM` (ignorando mayúsculas/minúsculas)
 * y se ejecuta un pipeline de agregación para encontrar el documento que coincida con el código concatenado.
 *
 * @param code - ObjectId o string que representa el código del ítem.
 * @returns Una promesa que se resuelve con el ObjectId del ítem encontrado o `null` si no se encuentra.
 *
 * @example
 * ```ts
 * // Ejemplo de uso:
 * const itemId = await ItemModel.findByCode("0001");
 * if (itemId) {
 *   console.log("Ítem encontrado:", itemId.toString());
 * } else {
 *   console.log("Ítem no encontrado");
 * }
 * ```
 */
export async function findByCode(
  this: ItemModel,
  code?: Types.ObjectId | string,
): Promise<Types.ObjectId | null> {
  if (isValidObjectId(code) && (await this.exists({ _id: code }))) {
    return new Types.ObjectId(code);
  }
  if (
    typeof code !== "string" || !RegExp(`^${pattern.ITEM}$`, "i").test(code)
  ) {
    return null;
  }

  const [doc] = await this.aggregate<PopulatedItem>()
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .project({
      code: { $concat: ["$key.line.code", "$key.brand.code", "$code"] },
    })
    .match({ code: code.toUpperCase() });

  return !doc?._id ? null : new Types.ObjectId(doc._id);
}

/**
 * Recupera información relacionada con la eliminación de un ítem.
 *
 * @remarks
 * Se ejecuta un pipeline de agregación que une la información de `Key`, `Line` y `Brand`
 * y, mediante un facet, agrupa la información de eliminación definida en `pipeline.FACET.DELETE_ITEMS`
 * y la proyecta usando `pipeline.PROJECT.DELETE_ITEMS`.
 *
 * @param field - Nombre del campo usado para filtrar.
 * @param id - Identificador (string) para el filtro.
 * @returns Una promesa que se resuelve con un objeto `DeletedInfo` con la información obtenida.
 *
 * @example
 * ```ts
 * // Ejemplo: obtener información de eliminación para un ítem específico.
 * const deletionInfo = await ItemModel.getBackInfo("key", "63abf...id");
 * console.log("Información de eliminación:", deletionInfo);
 * ```
 */
export async function getBackInfo(
  this: ItemModel,
  field: string,
  id?: string,
): Promise<DeletedInfo> {
  const [data_file] = await this.aggregate<DeletedInfo>()
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .match({ [field]: new Types.ObjectId(id) })
    .facet(pipeline.FACET.DELETE_ITEMS)
    .project(pipeline.PROJECT.DELETE_ITEMS);

  return data_file;
}

/**
 * Obtiene información poblada de un ítem utilizando un pipeline de agregación.
 *
 * @remarks
 * Si se proporciona un `id`, el pipeline filtra por ese ObjectId; luego se realiza
 * un lookup para poblar las propiedades `key`, `key.line` y `key.brand`, y finalmente
 * se proyecta el resultado usando `pipeline.PROJECT.ITEM`.
 *
 * @typeParam T - Tipo del documento poblado (por defecto `PopulatedItem`).
 * @param id - Opcional, identificador del ítem a poblar.
 * @returns Una instancia de `Aggregate<T[]>` para ejecutar el pipeline.
 *
 * @example
 * ```ts
 * // Obtener la información poblada de un ítem específico:
 * const agg = ItemModel.getPopulate<PopulatedItem>("63abf...id");
 * const populatedItems = await agg.exec();
 * console.log("Ítem poblado:", populatedItems);
 * ```
 */
export function getPopulate<T = PopulatedItem>(
  this: ItemModel,
  id?: string,
): Aggregate<T[]> {
  const aggregate = this.aggregate<T>();

  if (id) aggregate.match({ _id: new Types.ObjectId(id) });

  return aggregate
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .project(pipeline.PROJECT.ITEM);
}

/**
 * Ejecuta una búsqueda difusa (fuzzy) sobre el campo `code` de un ítem.
 *
 * @remarks
 * Se ejecuta un pipeline de agregación que realiza lookups para poblar la información
 * de `Key`, `Line` y `Brand`. Luego, concatena los códigos para formar un identificador
 * completo y calcula la distancia de Damerau-Levenshtein para determinar coincidencias cercanas.
 * Solo se retornan aquellos documentos cuya distancia sea exactamente 1, ordenados por `code`.
 *
 * @param key - Fragmento de cadena a comparar en el lookup.
 * @param code - Código base con el cual se comparan las concatenaciones.
 * @returns Una instancia de `Aggregate` que produce un arreglo de objetos con la propiedad `code`.
 *
 * @example
 * ```ts
 * // Ejemplo: búsqueda fuzzy que retorna resultados similares.
 * const fuzzyAgg = ItemModel.getFuzzy("GRAPVH", "0001");
 * const results = await fuzzyAgg.exec();
 * results.forEach(item => console.log(item.code));
 * ```
 */
export function getFuzzy(
  this: ItemModel,
  key: string,
  code: string,
): Aggregate<{ code: string }[]> {
  return this.aggregate<{ code: string }>()
    .match({ code })
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .project({
      key: { $concat: ["$key.line.code", "$key.brand.code"] },
      code: { $concat: ["$key.line.code", "$key.brand.code", "$code"] },
    })
    .addFields({
      distance: {
        $function: {
          body: damerauLevenshteinDistance,
          args: ["$key", key],
          lang: "js",
        },
      },
    })
    .match({ distance: { $eq: 1 } })
    .sort("code");
}

/**
 * Obtiene el estado de una imagen específica de un ítem.
 *
 * @remarks
 * Se realiza un pipeline de agregación que une la información de `Key`, `Line` y `Brand`,
 * desestructura el arreglo `images` y filtra por el `_id` del ítem y el `idN` de la imagen.
 * Finalmente, se proyecta el resultado utilizando `pipeline.PROJECT.STATUS`.
 *
 * @param _id - Identificador del ítem (como string).
 * @param idN - Identificador interno de la imagen dentro del arreglo `images`.
 * @returns Una instancia de `Aggregate` que produce un arreglo de objetos con las propiedades `code`
 * y `image` (el cual corresponde a una imagen del ítem).
 *
 * @example
 * ```ts
 * // Ejemplo: obtener el estado de la imagen número 2 de un ítem específico.
 * const statusAgg = ItemModel.getStatus("63abf...id", 2);
 * const [statusInfo] = await statusAgg.exec();
 * console.log("Código:", statusInfo.code);
 * console.log("Estado de la imagen:", statusInfo.image.status);
 * ```
 */
export function getStatus(
  this: ItemModel,
  _id: string,
  idN: number,
) {
  return this.aggregate<{
    code: string;
    image: LeanItem["images"][number];
  }>()
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .unwind("$images")
    .match({
      _id: new Types.ObjectId(_id),
      "images.idN": idN,
    })
    .project(pipeline.PROJECT.STATUS);
}

/**
 * Obtiene la información detallada de una imagen de un ítem.
 *
 * @remarks
 * Se utiliza un pipeline de agregación que une información de `Key`, `Line` y `Brand`,
 * desestructura el arreglo `images` y filtra por:
 * - `_id` del ítem.
 * - `idN` de la imagen.
 * - `images.status` igual a 5 (estado "Guardado").
 * Finalmente, se proyecta el resultado utilizando `pipeline.PROJECT.IMAGE`.
 *
 * @param _id - Identificador del ítem (como string).
 * @param idN - Identificador interno de la imagen dentro del arreglo `images`.
 * @returns Una instancia de `Aggregate` que produce un arreglo con objetos que incluyen
 * las propiedades `file`, `key`, `code` y `image`.
 *
 * @example
 * ```ts
 * // Ejemplo: obtener la información de la imagen número 2 de un ítem, filtrando por status = 5.
 * const imageAgg = ItemModel.getImage("63abf...id", 2);
 * const [imgInfo] = await imageAgg.exec();
 * console.log("Archivo:", imgInfo.file);
 * console.log("Key:", imgInfo.key);
 * console.log("Code:", imgInfo.code);
 * console.log("Imagen:", imgInfo.image);
 * ```
 */
export function getImage(
  this: ItemModel,
  _id: string,
  idN: number,
) {
  return this.aggregate<{
    file: string;
    key: string;
    code: string;
    image: LeanItem["images"][number];
    ext: string;
  }>()
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .unwind("$images")
    .match({
      _id: new Types.ObjectId(_id),
      "images.idN": idN,
      "images.status": 5,
    })
    .project(pipeline.PROJECT.IMAGE);
}
