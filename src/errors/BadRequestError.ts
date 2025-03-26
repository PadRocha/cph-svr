import { BaseError } from './BaseError.ts';

/**
 * Error que indica que el cliente envió una solicitud inválida.
 *
 * @remarks
 * Utiliza el código de estado HTTP 400 por defecto.
 */
export class BadRequestError extends BaseError {
  /**
   * Construye un `BadRequestError`.
   *
   * @param message - Mensaje descriptivo del error (por defecto: "Solicitud inválida")
   * @param details - Información adicional sobre el error
   */
  constructor(message: string = "Solicitud inválida", details?: unknown) {
    super(message, 400, true, details);
    this.name = "BadRequestError";
  }
}
