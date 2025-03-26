import type {
  Image,
  Item,
  ItemMethods,
  ItemModel,
} from "@interfaces/item.interface.ts";
import { model, Schema } from 'mongoose';

import {
    findByCode, getBackInfo, getFuzzy, getImage, getPopulate, getStatus
} from '@services/item.service.ts';
import { validateExistence } from '@utils/schemaValidators.ts';

/**
 * Esquema de Mongoose para la colección "Item".
 *
 * @remarks
 * - `key` referencia a la colección "Key" y se valida su existencia.
 * - `code` se rellena con ceros a la izquierda hasta 4 caracteres.
 * - `images` guarda un máximo de 3 imágenes, cada una con `idN` y `status`.
 */
const itemSchema = new Schema<Item, ItemModel, ItemMethods>({
  key: {
    type: Schema.Types.Mixed,
    ref: "Key",
    required: true,
    validate: validateExistence("Key"),
  },
  code: {
    type: String,
    trim: true,
    maxlength: 4,
    uppercase: true,
    required: true,
    set: (code: string) => code.padStart(4, "0"),
  },
  desc: {
    type: String,
    trim: true,
    required: true,
  },
  images: {
    type: [
      {
        idN: {
          type: Number,
          required: true,
          index: true,
        },
        status: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
          required: true,
        },
        ext: {
          type: String,
          enum: ["jpg", "jpeg", "png", "webp", "avif"],
        },
      },
    ],
    _id: false,
    idN: true,
    validate: {
      validator(images: Image[]) {
        return images.length <= 3;
      },
      message: "Array exceeds the limit of images",
      msg: "Image overflow",
    },
  },
});

// Se crean índices compuestos en `Item`.
itemSchema.index({ key: 1, code: 1 }, { unique: true });
itemSchema.index({ _id: 1, "images.idN": 1 }, { unique: true });
itemSchema.index({ desc: "text" });

// Se asignan métodos estáticos al esquema.
itemSchema.static("findByCode", findByCode);
itemSchema.static("getBackInfo", getBackInfo);
itemSchema.static("getPopulate", getPopulate);
itemSchema.static("getFuzzy", getFuzzy);
itemSchema.static("getStatus", getStatus);
itemSchema.static("getImage", getImage);

/**
 * Modelo de Mongoose para la colección "Item", basado en `itemSchema`.
 *
 * @example
 * ```ts
 * // Uso directo del modelo para crear un ítem
 * const newItem = await ItemModel.create({
 *   code: "0005",
 *   desc: "Nueva descripción",
 *   images: [{ idN: 1, status: 2 }],
 *   key: "63abc..."
 * });
 * console.log("Item creado:", newItem);
 *
 * // Uso para recuperar un ítem mediante findById
 * const existingItem = await ItemModel.findById("63abf...id").exec();
 * console.log(existingItem);
 * ```
 */
const ItemModel = model<Item, ItemModel>("Item", itemSchema);

export { ItemModel };
