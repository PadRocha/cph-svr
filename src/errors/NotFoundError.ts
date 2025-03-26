import { BaseError } from './BaseError.ts';

/**
 * Error que indica que el recurso solicitado no existe.
 *
 * @remarks
 * Asigna el código de estado 404, común para rutas inexistentes o
 * recursos no encontrados.
 */
export class NotFoundError extends BaseError {
  /**
   * Construye un `NotFoundError`.
   *
   * @param message - Mensaje descriptivo del error (por defecto: "Recurso no encontrado")
   * @param details - Información adicional sobre el error
   */
  constructor(message: string = "Recurso no encontrado", details?: unknown) {
    super(message, 404, true, details);
    this.name = "NotFoundError";
  }
}
