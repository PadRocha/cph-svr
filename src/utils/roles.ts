/**
 * @module utils
 * @description Funciones utilitarias para manejar roles de usuarios en el sistema.
 * Estas funciones permiten convertir entre números y arreglos de roles, verificar roles válidos y gestionar permisos.
 */

import { setup } from 'config';

type authRole = keyof typeof setup.AUTH;

const setupAuth: { [AUTH: string]: number } = setup.AUTH;

/**
 * Convierte un valor numérico de roles en un arreglo de roles como cadenas de texto.
 * Esto se utiliza para traducir valores binarios de roles en una representación legible.
 *
 * @param {number} [role] - Valor numérico que representa los roles del usuario.
 * @returns {string[]} Un arreglo de cadenas que representan los roles asignados.
 * @example
 * const roles = intoRoles(3);
 * console.log(roles); // ["ADMIN", "USER"]
 */
export function intoRoles(role?: number): string[] {
  if (!role) return new Array<string>();
  return Object.keys(setupAuth).filter((auths) => !!(role & setupAuth[auths]));
}

/**
 * Convierte un arreglo de roles en un valor numérico.
 * Este valor numérico es útil para almacenar los roles en formato binario en la base de datos.
 *
 * @param {authRole[]} [roles] - Un arreglo de cadenas que representan los roles asignados.
 * @returns {number} Un número que representa los roles combinados.
 * @example
 * const numericRole = intoRole(["ADMIN", "USER"]);
 * console.log(numericRole); // 3
 */
export function intoRole(roles?: authRole[]): number {
  if (!roles) return 0;
  return roles.reduce(
    (accumulator, role) => (accumulator |= setupAuth[role]),
    0,
  );
}

/**
 * Verifica si un conjunto de roles proporcionados es válido según los roles definidos en el sistema.
 * Se utiliza para validar roles antes de asignarlos a un usuario.
 *
 * @param {authRole | authRole[]} [roles] - Uno o más roles a validar.
 * @returns {boolean} `true` si todos los roles son válidos, `false` en caso contrario.
 * @example
 * const isValid = hasValidRoles(["ADMIN", "INVALID_ROLE"]);
 * console.log(isValid); // false
 */
export function hasValidRoles(roles?: authRole | authRole[]): boolean {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.every((r) => Object.keys(setupAuth).includes(r));
  } else if (
    roles instanceof String &&
    typeof roles === "string" &&
    !!roles.trim()
  ) {
    return Object.keys(setupAuth).includes(roles);
  } else return false;
}
