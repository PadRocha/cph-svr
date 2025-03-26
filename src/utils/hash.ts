/**
 * @module hash.utils
 * @description Funciones utilitarias para manejar hashes de contraseñas. Estas funciones son utilizadas principalmente
 * en servicios relacionados con la autenticación, como `user.service`.
 */

/**
 * Genera un hash de una contraseña utilizando un algoritmo SHA-256 y una sal.
 * Se usa comúnmente en servicios de usuarios para almacenar contraseñas de forma segura.
 *
 * @param {string} password - La contraseña en texto plano que se desea hashear.
 * @param {string} salt - La sal que se añade a la contraseña antes de hashear.
 * @returns {Promise<string>} Una promesa que resuelve con el hash hexadecimal de la contraseña y la sal combinadas.
 * @example
 * const password = "securepassword";
 * const salt = "randomsalt123";
 * const hashedPassword = await hashPassword(password, salt);
 * console.log(hashedPassword);
 */
export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash_buffer = await crypto.subtle.digest("SHA-256", data);
  const hash_array = Array.from(new Uint8Array(hash_buffer));
  const hash_hex = hash_array
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash_hex;
}

/**
 * Compara una contraseña con un hash almacenado utilizando la misma sal.
 * Internamente, genera un hash de la contraseña proporcionada y lo compara con el hash almacenado.
 * Se utiliza para validar contraseñas en servicios de autenticación.
 *
 * @param {string} password - La contraseña en texto plano que se desea verificar.
 * @param {string} salt - La sal que se utilizó al generar el hash almacenado.
 * @param {string} hash - El hash almacenado con el que se desea comparar.
 * @returns {Promise<boolean>} Una promesa que resuelve en `true` si los hashes coinciden, o `false` en caso contrario.
 * @example
 * const password = "securepassword";
 * const salt = "randomsalt123";
 * const storedHash = "a1b2c3d4e5f6...";
 * const isMatch = await compareHash(password, salt, storedHash);
 * if (isMatch) {
 *   console.log("La contraseña es correcta");
 * } else {
 *   console.log("La contraseña es incorrecta");
 * }
 */
export async function compareHash(
  password: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  return hash === (await hashPassword(password, salt));
}
