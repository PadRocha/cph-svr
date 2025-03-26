import { PipelineStage } from 'mongoose';

/**
 * Interfaz que representa la etapa `$addFields` de un pipeline.
 *
 * @remarks
 * Cada propiedad corresponde a algún "alias" de los campos a agregar.
 * Por ejemplo, en este caso tenemos `CODE`, que construye un campo concatenado.
 *
 * @typeParam T - Se alinea con la definición nativa de Mongoose para `$addFields`.
 */
interface AddFields<T = PipelineStage.AddFields["$addFields"]> {
  /**
   * Definición para agregar un campo `code` que concatena line.code, brand.code y code.
   */
  readonly CODE: T;
}

/**
 * Objeto con definiciones concretas para `$addFields`.
 *
 * - `CODE`: Construye un string uniendo varios subcampos.
 */
const ADDFIELDS: AddFields = {
  CODE: {
    code: {
      $concat: ["$key.line.code", "$key.brand.code", "$code"],
    },
  },
};

export { ADDFIELDS };
export type { AddFields };
