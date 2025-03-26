import type { LeanBrand } from "@interfaces/brand.interface.ts";
import { deleteBrand, getBrand, saveBrand, updateBrand } from "controllers";
import { Hono } from "deps";
import { authMiddleware, pathMiddleware } from "middlewares";

import { validateFields, validateId } from "@utils/validators.ts";

const brandRoutes = new Hono();

brandRoutes.post(
  validateFields<LeanBrand>("code", "desc"),
  authMiddleware,
  ...saveBrand,
);
brandRoutes.get(authMiddleware, ...getBrand);
brandRoutes.put(
  validateId(),
  validateFields<LeanBrand>("code", "desc"),
  authMiddleware,
  ...updateBrand,
);
brandRoutes.delete(
  validateId(),
  authMiddleware,
  pathMiddleware,
  ...deleteBrand,
);

export { brandRoutes };
