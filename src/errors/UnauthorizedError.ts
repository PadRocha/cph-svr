import { BaseError } from './BaseError.ts';

/**
 * Error que indica que no se tiene autorización para acceder
 * al recurso solicitado.
 *
 * @remarks
 * Corresponde al código de estado 401, que a menudo se emplea
 * cuando falta un token de autenticación o credenciales válidas.
 */
export class UnauthorizedError extends BaseError {
  /**
   * Construye un `UnauthorizedError`.
   *
   * @param message - Mensaje descriptivo del error (por defecto: "Acceso Denegado")
   * @param details - Información adicional sobre el error
   */
  constructor(message: string = "Acceso Denegado", details?: unknown) {
    super(message, 401, true, details);
    this.name = "UnauthorizedError";
  }
}
