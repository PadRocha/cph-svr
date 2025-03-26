import { extname } from "deps";

import { createMiddleware as factory } from "@hono/hono/factory";

export const parseImageMiddleware = factory(
  async ({ req, set, json }, next) => {
    const form_data = await req.formData();
    const file = form_data.get("image");

    if (!file || typeof file === "string") {
      return json({ error: "No image file found" }, 400);
    }

    const name = file.name;
    const type = file.type;
    const filetypes = /jpeg|jpg|png|avif|webp/i;
    const mimetype_ok = filetypes.test(type);
    const ext = extname(name);
    const extname_ok = filetypes.test(ext);

    if (!mimetype_ok || !extname_ok) {
      return json(
        {
          error: `File upload only supports jpeg/jpg types. Provided: ${type}`,
        },
        400,
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    set("image", { name, type, ext, buffer });
    await next();
  },
);
