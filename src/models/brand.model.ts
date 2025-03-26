import type {
  Brand,
  BrandMethods,
  BrandModel,
} from "@interfaces/brand.interface.ts";
import { model, Schema } from "mongoose";

import { findByCode } from "@services/brand.service.ts";

/**
 * Esquema de Mongoose para la colección "Brand", que define:
 *
 * - `code`: String (2 a 3 caracteres en mayúsculas), se rellena con espacios
 *   en caso de ser más corto.
 * - `desc`: String obligatorio, transformado a minúsculas y recortado.
 *
 * @remarks
 * También se establece un índice de texto sobre `code`.
 */
const brandSchema = new Schema<Brand, BrandModel, BrandMethods>({
  code: {
    type: String,
    minlength: 2,
    maxlength: 3,
    uppercase: true,
    unique: true,
    required: true,
    // Rellena con espacios hasta alcanzar 3 caracteres.
    set: (code: string) => code.padEnd(3, " "),
  },
  desc: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
});

// Se crea un índice de texto sobre el campo "code".
brandSchema.index({ code: "text" });

// Se asigna la función estática "findByCode" al esquema,
// importada desde "@services/brand.service.ts".
brandSchema.static("findByCode", findByCode);

/**
 * Modelo de Mongoose para "Brand", basado en `brandSchema`.
 *
 * @remarks
 * - Usa la interfaz `Brand` para el documento.
 * - Usa la interfaz `BrandModel` como la capa de modelo.
 */
const BrandModel = model<Brand, BrandModel>("Brand", brandSchema);

export { BrandModel };
