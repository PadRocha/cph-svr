import type {
  User,
  UserMethods,
  UserModel,
} from "@interfaces/user.interface.ts";
import { setup } from "config";
import { model, Schema } from "mongoose";

import {
  comparePassword,
  createToken,
  preSave,
  roleIncludes,
} from "@services/user.service.ts";

/**
 * Esquema de Mongoose para la entidad 'User'. Define la estructura de los campos,
 * tipos, validaciones y valores por defecto.
 */
const userSchema = new Schema<User, UserModel, UserMethods>({
  nickname: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    select: false,
  },
  password_salt: {
    type: String,
    required: true,
    default: () => crypto.randomUUID(),
    select: false,
  },
  role: {
    type: Number,
    default: setup.AUTH.READ | setup.AUTH.WRITE,
    required: true,
  },
});

/**
 * Hook que se ejecuta antes de guardar el documento. Verifica si se modificó
 * la contraseña y en caso afirmativo la re-hashea.
 */
userSchema.pre("save", preSave);

/**
 * Método de instancia para comparar la contraseña ingresada con la almacenada.
 */
userSchema.method("comparePassword", comparePassword);
userSchema.method("createToken", createToken);
userSchema.method("roleIncludes", roleIncludes);

/**
 * Modelo de Mongoose para la entidad 'User'.
 *
 * @example
 * // Creación de un nuevo usuario
 * const newUser = new UserModel({ nickname: "john_doe", password: "securepassword", role: setup.AUTH.READ });
 * await newUser.save();
 *
 * // Comparación de contraseña
 * const isMatch = await newUser.comparePassword("securepassword");
 */
const UserModel = model<User, UserModel>("User", userSchema);

export { UserModel };
