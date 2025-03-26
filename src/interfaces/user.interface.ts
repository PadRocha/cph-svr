import type { setup } from "config";
import type { HydratedDocument, Model, Types } from "mongoose";

/**
 * Interfaz principal para describir la entidad de 'User'.
 * Contiene propiedades esenciales como `nickname`, `password`, `role`, etc.
 */
interface User {
  /**
   * Nombre de usuario único, usado para identificación.
   */
  readonly nickname: string;

  /**
   * Identificador opcional (sub) en caso de provenir de un tercero o
   * algún otro sistema de autenticación.
   */
  readonly sub?: string;

  /**
   * Contraseña en texto plano (NO SE RECOMIENDA almacenar en texto plano en producción).
   * Aquí solo se usa antes de guardarla como hash.
   */
  password?: string;

  /**
   * Sal para el hashing de la contraseña. Se genera si no se proporciona.
   */
  password_salt?: string;

  /**
   * Rol principal del usuario. Se guarda como un número en el que cada bit
   * representa una bandera de autorización (por ejemplo, READ, WRITE, etc.).
   */
  role?: number;

  /**
   * Roles opcionales en un array, usado para mapear cada bit a una clave de setup.AUTH.
   */
  roles?: (keyof typeof setup.AUTH)[];
}

/**
 * Interfaz para métodos de instancia (métodos que se utilizan sobre los documentos de usuario).
 */
interface UserMethods {
  /**
   * Compara la contraseña proporcionada con la contraseña hash almacenada.
   *
   * @param password - Contraseña de texto plano a verificar.
   * @returns true si la contraseña coincide, false en caso contrario.
   * @example
   * const isMatch = await user.comparePassword("12345");
   */
  comparePassword(password?: string): Promise<boolean>;

  /**
   * Genera un JWT con datos del usuario, incluyendo su ID, nickname y rol.
   *
   * @returns Una promesa que resuelve con el token JWT.
   * @example
   * const token = await user.createToken();
   */
  createToken(): Promise<string>;

  /**
   * Verifica si el usuario incluye al menos uno de los roles especificados.
   *
   * @param roles - Lista de nombres de roles a verificar.
   * @returns true si el usuario posee alguno de los roles, false de lo contrario.
   * @example
   * if (user.roleIncludes("WRITE")) {
   *   // Tiene permisos de escritura
   * }
   */
  roleIncludes(...roles: (keyof typeof setup.AUTH)[]): boolean;
}

/**
 * Tipo de Mongoose que extiende el modelo genérico para incluir
 * los métodos de instancia definidos en `UserMethods`.
 */
type UserModel = Model<User, Record<symbol, null>, UserMethods>;

/**
 * Tipo que representa un documento de Mongoose para la entidad 'User'.
 *
 * @example
 * // Creación de un documento de usuario
 * const userDocument: UserDocument = new UserModel({ nickname: "jane_doe", password: "securepassword", role: setup.AUTH.WRITE });
 * await userDocument.save();
 *
 * // Generación de token JWT
 * const token = await userDocument.createToken();
 */
type UserDocument = HydratedDocument<User, UserMethods>;

/**
 * Representa un objeto plano de 'User' que incluye la propiedad '_id'
 * de tipo 'Types.ObjectId'. Se usa principalmente en respuestas
 * de agregados que devuelven documentos lean (sin métodos Mongoose).
 */
type LeanUser = User & { _id: Types.ObjectId };

export type { LeanUser, User, UserDocument, UserMethods, UserModel };
