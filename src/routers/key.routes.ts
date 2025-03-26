import type { LeanKey } from "@interfaces/key.interface.ts";
import {
  deleteKey,
  getCodeKey,
  getKey,
  resetKey,
  saveKey,
  updateKey,
} from "controllers";
import { Hono } from "deps";
import { authMiddleware, pathMiddleware } from "middlewares";

import { validateFields, validateId } from "@utils/validators.ts";

const keyRoutes = new Hono();

keyRoutes.post(
  validateFields<LeanKey>("line", "brand"),
  authMiddleware,
  ...saveKey,
);
keyRoutes.get(authMiddleware, ...getKey);
keyRoutes.put(
  validateId(),
  validateFields<LeanKey>("line", "brand"),
  authMiddleware,
  ...updateKey,
);
keyRoutes.delete(validateId(), authMiddleware, pathMiddleware, ...deleteKey);

keyRoutes.put(
  "/reset",
  validateId(),
  authMiddleware,
  pathMiddleware,
  ...resetKey,
);

keyRoutes.get("/code", authMiddleware, ...getCodeKey);

export { keyRoutes };
