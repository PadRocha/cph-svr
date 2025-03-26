import type { Version } from "@interfaces/update.interface.ts";
import { checkForUpdate, updateVersionData } from "controllers";
import { Hono } from "deps";
import { authMiddleware, versionFileMiddleware } from "middlewares";

import { validateFields } from "@utils/validators.ts";

const updateRoutes = new Hono();

updateRoutes.use(versionFileMiddleware);
updateRoutes.get("/:plataform/:current_version", ...checkForUpdate);
updateRoutes.post(
  "/:plataform",
  validateFields<Version>("version", "url", "signature", "pub_date", "notes"),
  authMiddleware,
  ...updateVersionData,
);

export { updateRoutes };
