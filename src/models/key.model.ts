import type { Key, KeyMethods, KeyModel } from "@interfaces/key.interface.ts";
import { model, Schema } from "mongoose";

import { findByCode, getFuzzy, getPopulate } from "@services/key.service.ts";
import { validateExistence } from "@utils/schemaValidators.ts";

/**
 * Esquema de Mongoose para la colección "Key".
 *
 * @remarks
 * - `line` y `brand` referencian a los modelos `Line` y `Brand`, validando su existencia.
 * - Se establece un índice único compuesto por `(line, brand)`.
 */
const keySchema = new Schema<Key, KeyModel, KeyMethods>({
  line: {
    type: Schema.Types.Mixed,
    ref: "Line",
    required: true,
    validate: validateExistence("Line"),
  },
  brand: {
    type: Schema.Types.Mixed,
    ref: "Brand",
    required: true,
    validate: validateExistence("Brand"),
  },
});

// Se crean índices compuestos en `Key`.
keySchema.index({ line: 1, brand: 1 }, { unique: true });

// Se asignan métodos estáticos al esquema.
keySchema.static("findByCode", findByCode);
keySchema.static("getPopulate", getPopulate);
keySchema.static("getFuzzy", getFuzzy);

/**
 * Modelo de Mongoose para la colección "Key", basado en `keySchema`.
 *
 * @example
 * ```ts
 * // Crear un nuevo documento Key
 * const newKey = await KeyModel.create({
 *   line: "63abc...",
 *   brand: "63def..."
 * });
 * console.log("Nueva clave:", newKey);
 * ```
 */
const KeyModel = model<Key, KeyModel>("Key", keySchema);

export { KeyModel };
