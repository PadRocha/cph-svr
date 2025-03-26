import type { LeanLine } from "@interfaces/line.interface.ts";
import { deleteLine, getLine, saveLine, updateLine } from "controllers";
import { Hono } from "deps";
import { authMiddleware } from "middlewares";

import { validateFields, validateId } from "@utils/validators.ts";

const lineRoutes = new Hono();

lineRoutes.post(
  validateFields<LeanLine>("code", "desc"),
  authMiddleware,
  ...saveLine,
);
lineRoutes.get(authMiddleware, ...getLine);
lineRoutes.put(
  validateId(),
  validateFields<LeanLine>("code", "desc"),
  authMiddleware,
  ...updateLine,
);
lineRoutes.delete(validateId(), authMiddleware, ...deleteLine);

export { lineRoutes };
