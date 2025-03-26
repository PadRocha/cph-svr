import type { PlatformVersions } from "@interfaces/update.interface.ts";
import { existsSync, resolve } from "deps";

import { createMiddleware as factory } from "@hono/hono/factory";

const initialData: PlatformVersions = {
  platforms: {},
};

export const versionFileMiddleware = factory(async ({ set }, next) => {
  const versionFile = resolve(Deno.cwd(), "versions.json");
  if (!existsSync(versionFile)) {
    Deno.writeTextFileSync(versionFile, JSON.stringify(initialData, null, 2));
  }

  set("version-file", versionFile);
  await next();
});
