import { deleteImage, displayImage, updateImage } from "controllers";
import { Hono, validator } from "deps";
import { BadRequestError } from "errors";
import {
  authMiddleware,
  parseImageMiddleware,
  pathMiddleware,
} from "middlewares";
import { pattern } from "regex";

import { validateId, validateIdN } from "@utils/validators.ts";

const imageRoutes = new Hono();

imageRoutes.put(
  validateId(),
  validateIdN(),
  authMiddleware,
  pathMiddleware,
  parseImageMiddleware,
  ...updateImage,
);
imageRoutes.delete(
  validateId(),
  validateIdN(),
  authMiddleware,
  pathMiddleware,
  ...deleteImage,
);

imageRoutes.get(
  "/:key/:file",
  validator("param", (v) => {
    if (!RegExp(`^${pattern.ITEM} [1-3]$`).test(v.file)) {
      throw new BadRequestError("Invalid file");
    }
    return v;
  }),
  pathMiddleware,
  ...displayImage,
);

export { imageRoutes };
