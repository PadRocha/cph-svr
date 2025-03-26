/**
 * Módulo que exporta patrones de expresiones regulares para validar
 * distintos tipos de cadenas alfanuméricas usadas en la aplicación.
 *
 * @remarks
 * Estos patrones se usan, por ejemplo, para asegurarnos de que las
 * líneas, marcas, llaves e items cumplan con un formato específico
 * en mayúsculas y dígitos.
 */

/**
 * Patrones de regex para validaciones varias en la aplicación.
 *
 * - `LINE`: Debe ser exactamente 3 caracteres alfanuméricos en mayúsculas.
 * - `BRAND`: Debe ser 2 o 3 caracteres alfanuméricos en mayúsculas.
 * - `KEY`: Debe ser 5 o 6 caracteres alfanuméricos en mayúsculas.
 * - `ITEM`: Combina dos segmentos y debe cumplir con [A-Z0-9] etc.
 */
export const pattern = {
  /** Patrón para código de línea (3 caracteres). */
  LINE: "[A-Z0-9]{3}",
  /** Patrón para código de marca (2 a 3 caracteres). */
  BRAND: "[A-Z0-9]{2,3}",
  /** Patrón para llaves (5 o 6 caracteres). */
  KEY: "[A-Z0-9]{5,6}",
  /** Patrón para items. Combina uno de los dos formatos y 4 caracteres más. */
  ITEM: "([A-Z0-9]{6}|[A-Z0-9]{5}\\s)[A-Z0-9]{4}",
  RFC3339: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
  VERSION: /^v?\d+\.\d+\.\d+$/,
} as const;
