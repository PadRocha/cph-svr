import { BaseError } from './BaseError.ts';

/**
 * Error que indica que se ha utilizado un método HTTP
 * no permitido para el recurso o la ruta solicitada.
 *
 * @remarks
 * Se asocia con el código de estado 405.
 */
export class MethodNotAllowedError extends BaseError {
  /**
   * Construye un `MethodNotAllowedError`.
   *
   * @param message - Mensaje descriptivo del error (por defecto: "Método HTTP no permitido")
   * @param details - Información adicional sobre el error
   */
  constructor(message: string = "Método HTTP no permitido", details?: unknown) {
    super(message, 405, true, details);
    this.name = "MethodNotAllowedError";
  }
}
