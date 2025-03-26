import type {
  PlatformVersions,
  Version,
} from "@interfaces/update.interface.ts";
import { BadRequestError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { pattern } from "regex";

import { isNewerVersion } from "@utils/version.ts";

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) throw new UnauthorizedError();

  const body = await req.json<Version>();
  const versionFile = get("version-file");
  const fileContent = await Deno.readTextFile(versionFile);
  const data: PlatformVersions = JSON.parse(fileContent);
  const plataform = req.param("plataform");
  const current = data.platforms[plataform];
  if (!current) {
    data.platforms[plataform] = {
      current_version: body.version,
      url: body.url,
      signature: body.signature,
      pub_date: body.pub_date,
      notes: body.notes,
      version_history: [],
    };
  } else {
    if (!pattern.VERSION.test(body.version)) {
      throw new BadRequestError("Invalid version format");
    }
    if (!isNewerVersion(body.version, current.current_version)) {
      throw new BadRequestError("Version is not newer");
    }
    if (body.version === current.current_version) {
      throw new BadRequestError("Version is the same");
    }

    data.platforms[plataform] = {
      current_version: body.version,
      url: body.url,
      signature: body.signature,
      pub_date: body.pub_date,
      notes: body.notes,
      version_history: [
        ...current.version_history,
        {
          version: current.current_version,
          url: current.url,
          signature: current.signature,
          pub_date: current.pub_date,
          notes: current.notes,
        },
      ],
    };
  }

  Deno.writeTextFileSync(versionFile, JSON.stringify(data, null, 2));
  return json({
    status: "success",
    message: `Version ${body.version} for ${plataform} updated successfully`,
  });
});
