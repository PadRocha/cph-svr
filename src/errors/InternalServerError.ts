import { BaseError } from './BaseError.ts';

/**
 * Error que indica una falla interna del servidor.
 *
 * @remarks
 * Se interpreta típicamente como un error no previsto en la lógica, por eso
 * `isOperational` se marca en `false`.
 */
export class InternalServerError extends BaseError {
  /**
   * Construye un `InternalServerError`.
   *
   * @param message - Mensaje descriptivo del error (por defecto: "Error interno del servidor")
   * @param details - Información adicional sobre el error
   */
  constructor(
    message: string = "Error interno del servidor",
    details?: unknown,
  ) {
    super(message, 500, false, details);
    this.name = "InternalServerError";
  }
}
