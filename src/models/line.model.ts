import type {
  Line,
  LineMethods,
  LineModel,
} from "@interfaces/line.interface.ts";
import { model, Schema } from "mongoose";

import { findByCode } from "@services/line.service.ts";

/**
 * Esquema de Mongoose para la colección "Line".
 *
 * @remarks
 * - El campo `code` debe tener entre 2 y 3 caracteres, se convierte a mayúsculas,
 *   se establece como único y se formatea para que tenga exactamente 3 caracteres.
 * - El campo `desc` es obligatorio, se convierte a minúsculas y se recorta.
 * - Se crea un índice de texto sobre el campo `code` para facilitar búsquedas.
 */
const lineSchema = new Schema<Line, LineModel, LineMethods>({
  code: {
    type: String,
    minlength: 2,
    maxlength: 3,
    uppercase: true,
    unique: true,
    required: true,
    set: (code: string) => code.padEnd(3, " "),
  },
  desc: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
});

// Se crean índices compuestos en `Line`.
lineSchema.index({ code: "text" });

// Se asignan métodos estáticos al esquema.
lineSchema.static("findByCode", findByCode);

/**
 * Modelo de Mongoose para la colección "Line", basado en `lineSchema`.
 *
 * @example
 * ```ts
 * // Ejemplo de creación de una nueva línea:
 * const newLine = await LineModel.create({
 *   code: "ABC",
 *   desc: "línea de ejemplo",
 * });
 * console.log("Nueva línea creada:", newLine);
 * ```
 */
const LineModel = model<Line, LineModel>("Line", lineSchema);

export { LineModel };
