import type { UserDocument } from "@interfaces/user.interface.ts";
import { setup } from 'config';
import { SignJWT } from 'jose';
import { CallbackWithoutResultAndOptionalError } from 'mongoose';

import { compareHash, hashPassword } from '@utils/hash.ts';
import { hasValidRoles } from '@utils/roles.ts';

/**
 * Hook que se ejecuta antes de guardar un documento de usuario.
 * Si la contraseña ha sido modificada, se vuelve a hashear utilizando
 * la sal existente en el documento.
 *
 * @param {UserDocument} this - El documento actual de usuario.
 * @param {CallbackWithoutResultAndOptionalError} next - Función para continuar con el siguiente middleware.
 * @returns {Promise<void>} Una promesa que se resuelve cuando el hook ha terminado de procesar.
 * @example
 * userSchema.pre("save", preSave);
 */
export async function preSave(
  this: UserDocument,
  next: CallbackWithoutResultAndOptionalError,
): Promise<void> {
  if (!this.isModified("password")) {
    return next();
  }
  const new_hash = await hashPassword(this.password!, this.password_salt!);
  this.password = new_hash;
  return next();
}

/**
 * Compara la contraseña proporcionada con el hash almacenado en el documento.
 *
 * @param {UserDocument} this - El documento actual de usuario.
 * @param {string} password - La contraseña de texto plano ingresada por el usuario.
 * @returns {Promise<boolean>} Una promesa que resuelve en true si la contraseña coincide, o false en caso contrario.
 * @example
 * const isMatch = await user.comparePassword("mi_password");
 * if (isMatch) {
 *   console.log("La contraseña es correcta");
 * } else {
 *   console.log("Contraseña incorrecta");
 * }
 */
export async function comparePassword(
  this: UserDocument,
  password: string,
): Promise<boolean> {
  if (!password?.trim() || !this.password) return false;
  return await compareHash(password, this.password_salt!, this.password!);
}

/**
 * Crea un JWT con duración de 30 días usando la información del usuario.
 * Se incluyen claims como el `sub` (ID de usuario), `nickname` y `role`, además
 * de las marcas de tiempo de creación (iat) y expiración (exp).
 *
 * @param {UserDocument} this - El documento actual de usuario.
 * @returns {Promise<string>} Promesa que resuelve en el token JWT.
 * @example
 * const token = await user.createToken();
 * console.log("Token generado:", token);
 */
export async function createToken(this: UserDocument): Promise<string> {
  const payload = {
    sub: this._id.toString(),
    nickname: this.nickname,
    role: this.role!,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: setup.KEY.ALG })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(setup.KEY.SECRET));
}

/**
 * Verifica si el usuario actual incluye al menos uno de los roles especificados.
 * Internamente valida que los roles sean válidos y posteriormente revisa
 * si el valor numérico `role` del usuario contiene alguna de las banderas indicadas.
 *
 * @param {UserDocument} this - El documento actual de usuario.
 * @param {...(keyof typeof setup.AUTH)[]} roles - Lista de roles a verificar.
 * @returns {boolean} true si alguno de los roles especificados está incluido en el usuario, false en caso contrario.
 * @example
 * const canWrite = user.roleIncludes("WRITE");
 * if (canWrite) {
 *   console.log("El usuario tiene permisos de escritura");
 * } else {
 *   console.log("El usuario NO tiene permisos de escritura");
 * }
 */
export function roleIncludes(
  this: UserDocument,
  ...roles: (keyof typeof setup.AUTH)[]
): boolean {
  if (!hasValidRoles(roles)) {
    return false;
  }
  return roles.some((r) => !!(this.role! & setup.AUTH[r]));
}
