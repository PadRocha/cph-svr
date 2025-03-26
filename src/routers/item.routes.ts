import type { LeanItem } from "@interfaces/item.interface.ts";
import {
    deleteItem, fuzzyItem, getItem, infoItem, navigateItem, resetItem, saveItem, statusItem,
    summaryItem, updateItem
} from 'controllers';
import { Hono, validator } from 'deps';
import { BadRequestError } from 'errors';
import { authMiddleware, pathMiddleware } from 'middlewares';
import { pattern } from 'regex';

import { validateFields, validateId, validateIdN } from '@utils/validators.ts';

const itemRoutes = new Hono();

itemRoutes.post(
  validateFields<LeanItem>("key", "code", "desc"),
  authMiddleware,
  ...saveItem,
);
itemRoutes.get(
  authMiddleware,
  ...getItem,
);
itemRoutes.put(
  validateId(),
  validateFields<LeanItem>("key", "code", "desc"),
  authMiddleware,
  ...updateItem,
);
itemRoutes.delete(validateId(), authMiddleware, pathMiddleware, ...deleteItem);

itemRoutes.put(
  "/reset",
  validateId(),
  authMiddleware,
  pathMiddleware,
  ...resetItem,
);
itemRoutes.get("/info", authMiddleware, ...infoItem);
itemRoutes.get("/summary", authMiddleware, ...summaryItem);
itemRoutes.get("/fuzzy", authMiddleware, ...fuzzyItem);
itemRoutes.get(
  "/navigate",
  validator("query", (v: { code: string; direction: string }) => {
    if (!v.code || !v.direction || !RegExp(`^${pattern.ITEM}$`).test(v.code)) {
      throw new BadRequestError("Código y sentido son requeridos");
    }

    return v;
  }),
  authMiddleware,
  ...navigateItem,
);
itemRoutes.get(
  "/status",
  validateId(),
  validateIdN(),
  authMiddleware,
  ...statusItem,
);

export { itemRoutes };
