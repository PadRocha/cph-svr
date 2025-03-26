import type { LeanUser } from "@interfaces/user.interface.ts";
import { listUser, loginUser, registerUser, returnUser } from 'controllers';
import { Hono, validator } from 'deps';
import { BadRequestError } from 'errors';
import { authMiddleware } from 'middlewares';

import { hasValidRoles } from '@utils/roles.ts';
import { validateFields } from '@utils/validators.ts';

const userRoutes = new Hono();

userRoutes.post(
  "/register",
  validateFields<LeanUser>("nickname", "password", "roles"),
  validator("json", (v) => {
    if (!hasValidRoles(v.roles)) {
      throw new BadRequestError("Los roles proporcionados no son válidos");
    }

    return v;
  }),
  authMiddleware,
  ...registerUser,
);
userRoutes.post(
  "/login",
  validateFields<LeanUser>("nickname", "password"),
  ...loginUser,
);
userRoutes.get("/list", authMiddleware, ...listUser);
userRoutes.get("/info", authMiddleware, ...returnUser);

export { userRoutes };
