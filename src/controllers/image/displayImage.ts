import { setup } from "config";
import { existsSync, resolve } from "deps";
import { InternalServerError, NotFoundError } from "errors";
import { factory } from "factory";
import sharp from "sharp";

type ImageMode = "PLACEHOLDER" | "HIGH" | "LOW";
const MODES = ["PLACEHOLDER", "HIGH", "LOW"];
const isValidMode = (val: string): val is ImageMode => MODES.includes(val);

export default factory.createHandlers(async ({ req, get, body }) => {
  const location = req.query("location") ?? get("location");
  const key = req.param("key");
  const file = req.param("file");
  const raw_mode = req.query("mode") ?? "LOW";
  const mode = isValidMode(raw_mode) ? raw_mode : "LOW";
  const { QUALITY, EFFORT, LOSSLESS, CHROMA } = setup.IMAGE[mode];
  const fileName = `${file}.${setup.IMAGE.EXT}`;
  const originalPath = resolve(location, "assets", key, fileName);
  if (!existsSync(originalPath)) {
    throw new NotFoundError("Imagen no encontrada");
  }

  const transform = sharp(originalPath);
  if (mode === "PLACEHOLDER") {
    const height = setup.IMAGE.SIZE[mode];
    const output = await transform.resize({ height, fit: "cover" })
      .avif({
        quality: QUALITY,
        effort: EFFORT,
        lossless: LOSSLESS,
        chromaSubsampling: CHROMA,
      })
      .toBuffer();
    return body(output.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/avif",
        "Cache-Control": "no-store",
      },
    });
  }

  const canvasWidth = Number(req.query("width"));
  const canvasHeight = Number(req.query("height"));
  const reqQuality = Number(req.query("quality"));
  const quality = !isNaN(reqQuality) && reqQuality > 0 ? reqQuality : QUALITY;
  const cacheDir = resolve(location, "assets", key, ".cache");
  let cacheFile = `${file}_q${quality}`;
  if (canvasWidth || canvasHeight) {
    cacheFile += `_${canvasWidth || ""}x${canvasHeight || ""}`;
  }
  cacheFile += `_${mode}.avif`;
  const cachePath = resolve(cacheDir, cacheFile);

  if (!existsSync(cacheDir)) {
    await Deno.mkdir(cacheDir, { recursive: true });
    if (Deno.build.os === "windows") {
      await new Deno.Command("attrib", {
        args: ["+h", cacheDir],
      }).output();
    }
  }

  if (existsSync(cachePath)) {
    const cached = await Deno.readFile(cachePath);
    await Deno.utime(cachePath, new Date(), new Date());
    return body(cached.buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/avif",
      },
    });
  }

  if (!isNaN(canvasWidth) && !isNaN(canvasHeight)) {
    const { width, height } = await transform.metadata();
    if (!width || !height) throw new InternalServerError();
    const isNotSquare = width !== height;
    if (isNotSquare && canvasHeight < canvasWidth) {
      const newWidth = Math.round((canvasHeight * width) / height);
      transform.resize({ width: newWidth, height: canvasHeight, fit: "fill" });

      if (newWidth >= canvasWidth) {
        const left_x = Math.round((newWidth - canvasWidth) / 2);
        transform.extract({
          left: left_x,
          top: 0,
          width: canvasWidth,
          height: canvasHeight,
        });
      } else {
        const leftover = canvasWidth - newWidth;
        const left = Math.floor(leftover / 2);
        const right = leftover - left;
        transform.extend({
          top: 0,
          bottom: 0,
          left,
          right,
          background: "white",
        });
      }
    } else if (isNotSquare && canvasHeight >= canvasWidth) {
      const newHeight = Math.round((canvasWidth * height) / width);
      transform.resize({ width: canvasWidth, height: newHeight, fit: "fill" });

      if (newHeight >= canvasHeight) {
        const top_y = Math.round((newHeight - canvasHeight) / 2);
        transform.extract({
          left: 0,
          top: top_y,
          width: canvasWidth,
          height: canvasHeight,
        });
      } else {
        const leftover = canvasHeight - newHeight;
        const top = Math.floor(leftover / 2);
        const bottom = leftover - top;
        transform.extend({
          left: 0,
          right: 0,
          top,
          bottom,
          background: "white",
        });
      }
    } else {
      transform.resize({
        width: canvasWidth,
        height: canvasHeight,
        fit: "fill",
      });
    }
  } else if (!isNaN(canvasWidth)) {
    transform.resize({ width: canvasWidth, fit: "cover" });
  } else if (!isNaN(canvasHeight)) {
    transform.resize({ height: canvasHeight, fit: "cover" });
  }

  const output = await transform
    .avif({
      quality,
      effort: EFFORT,
      lossless: LOSSLESS,
      chromaSubsampling: CHROMA,
    })
    .toBuffer();
  await Deno.writeFile(cachePath, output);

  const headers: Record<string, string> = {
    "Content-Type": "image/avif",
  };
  if (mode === "LOW") {
    headers["Cache-Control"] = "public, max-age=3600, must-revalidate";
  }
  return body(output.buffer as ArrayBuffer, {
    status: 200,
    headers,
  });
});
