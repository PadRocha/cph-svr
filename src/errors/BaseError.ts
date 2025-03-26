import { StatusCode } from '@hono/hono/utils/http-status';

/**
 * Clase base para modelar errores personalizados en la aplicación.
 *
 * @remarks
 * - `BaseError` hereda de `Error` y agrega campos como `status`, `isOperational`, `details`,
 *   y `timestamp`.
 * - Se emplea para distinguir errores operacionales (los que están planeados en la lógica
 *   de negocio) de aquellos no controlados.
 */
export class BaseError extends Error {
  /**
   * Código de estado HTTP asociado al error.
   */
  public status: StatusCode;

  /**
   * Indica si este error es operacional, es decir, si fue previsto y
   * controlado de alguna manera en la aplicación.
   */
  public isOperational: boolean;

  /**
   * Información adicional o detalles técnicos acerca del error (por ejemplo,
   * el objeto que causó el fallo, o metadatos útiles para diagnosticarlo).
   */
  public details?: unknown;

  /**
   * Momento exacto (fecha y hora) en que ocurrió el error.
   */
  public timestamp: Date;

  /**
   * Crea una nueva instancia de `BaseError`.
   *
   * @param message - Mensaje descriptivo del error
   * @param status - Código de estado HTTP correspondiente
   * @param isOperational - Define si el error es operativo (por defecto `true`)
   * @param details - Datos o metadatos adicionales para diagnosticar el error
   */
  constructor(
    message: string,
    status: StatusCode,
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    // Captura la traza de la pila para una mejor depuración.
    Error.captureStackTrace(this);
  }

  /**
   * Convierte la instancia de error a un objeto JSON, útil para
   * serializar la información del error en logs o respuestas HTTP.
   *
   * @returns Un objeto con las propiedades relevantes del error.
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      isOperational: this.isOperational,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}
