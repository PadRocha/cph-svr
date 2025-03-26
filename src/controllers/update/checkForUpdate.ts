import type { PlatformVersions } from "@interfaces/update.interface.ts";
import { factory } from "factory";

import { isNewerVersion } from "@utils/version.ts";

export default factory.createHandlers(async ({ req, get, json, body }) => {
  const plataform = req.param("plataform");
  const clientVersion = req.param("current_version");
  const fileContent = await Deno.readTextFile(get("version-file"));
  const data: PlatformVersions = JSON.parse(fileContent);
  const current = data.platforms[plataform];
  if (!current) body(null, 204);
  if (isNewerVersion(current.current_version, clientVersion)) {
    return json({
      version: current.current_version,
      pub_date: current.pub_date,
      url: current.url,
      signature: current.signature,
      notes: current.notes,
    }, 200);
  }

  return body(null, 204);
});
