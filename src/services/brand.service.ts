import type { LeanBrand } from "@interfaces/brand.interface.ts";
import { isValidObjectId, Types } from "deps";
import { BrandModel } from "models";
import { pattern } from "regex";

/**
 * Busca una marca por su código y retorna su ObjectId si existe.
 *
 * @remarks
 * Esta función se utiliza como método estático en el modelo `BrandModel` para
 * buscar una marca. Si se pasa un ObjectId válido y existe en la colección, se retorna
 * dicho ObjectId. Si se pasa un string, se valida que cumpla con el patrón definido en
 * `pattern.BRAND` (sin considerar mayúsculas/minúsculas) y se ejecuta un pipeline de
 * agregación para encontrar el _id asociado a ese código (convertido a mayúsculas).
 *
 * @param code - El identificador de la marca, el cual puede ser un `Types.ObjectId` o un string.
 * @returns Una promesa que resuelve con el `ObjectId` de la marca si se encuentra; de lo contrario, retorna `null`.
 *
 * @example
 * ```ts
 * // Uso dentro del contexto de BrandModel:
 * const brandId = await BrandModel.findByCode("PVH");
 * if (brandId) {
 *   console.log("Marca encontrada:", brandId.toString());
 * } else {
 *   console.log("No se encontró la marca.");
 * }
 * ```
 */
export async function findByCode(
  this: typeof BrandModel,
  code?: Types.ObjectId | string,
): Promise<Types.ObjectId | null> {
  if (isValidObjectId(code) && (await this.exists({ _id: code }))) {
    return new Types.ObjectId(code);
  }

  if (
    typeof code !== "string" || !RegExp(`^${pattern.BRAND}$`, "i").test(code)
  ) {
    return null;
  }

  const [doc] = await this.aggregate<LeanBrand>()
    .match({ code: code.toUpperCase() })
    .project({ _id: 1 });

  return !doc?._id ? null : new Types.ObjectId(doc._id);
}
