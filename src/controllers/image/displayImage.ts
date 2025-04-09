import { setup } from "config";
import { existsSync, resolve } from "deps";
import { InternalServerError, NotFoundError } from "errors";
import { factory } from "factory";
import sharp from "sharp";

/**
 * Función auxiliar para calcular el hash (SHA-1) de un buffer.
 * Retorna la cadena sin comillas, por ejemplo: 86968e2192c173cf...
 */
async function calculateRawHash(buffer: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calcula el ETag con comillas; por ejemplo: "86968e2192c173cf..."
 */
async function calculateETag(buffer: Uint8Array): Promise<string> {
  const rawHash = await calculateRawHash(buffer);
  return `"${rawHash}"`;
}

type ImageMode = "PLACEHOLDER" | "HIGH" | "LOW";
const MODES = ["PLACEHOLDER", "HIGH", "LOW"];
const isValidMode = (val: string): val is ImageMode => MODES.includes(val);

export default factory.createHandlers(async ({ req, get, body }) => {
  const location = req.query("location") ?? get("location");
  const key = req.param("key");
  const file = req.param("file");
  const version = req.query("v") ?? req.query("version") ?? "";
  const raw_mode = req.query("mode") ?? "LOW";
  const mode = isValidMode(raw_mode) ? raw_mode : "LOW";
  const { QUALITY, EFFORT, LOSSLESS, CHROMA } = setup.IMAGE[mode];
  const fileName = `${file}.${setup.IMAGE.EXT}`;
  const originalPath = resolve(location, "assets", key, fileName);

  if (!existsSync(originalPath)) {
    throw new NotFoundError("Imagen no encontrada");
  }

  // Obtener info del archivo original para Last-Modified
  const fileInfo = await Deno.stat(originalPath);
  const lastModified = fileInfo.mtime
    ? fileInfo.mtime.toUTCString()
    : new Date().toUTCString();

  const transform = sharp(originalPath);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO PLACEHOLDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === "PLACEHOLDER") {
    const height = setup.IMAGE.SIZE[mode];
    const output = await transform
      .resize({ height, fit: "cover" })
      .avif({
        quality: QUALITY,
        effort: EFFORT,
        lossless: LOSSLESS,
        chromaSubsampling: CHROMA,
      })
      .toBuffer();

    const etag = await calculateETag(output);

    if (!version) {
      if (req.header("if-none-match") === etag) {
        return body(null, {
          status: 304,
          headers: { "ETag": etag },
        });
      }
      if (req.header("if-modified-since")) {
        const ims = new Date(req.header("if-modified-since")!);
        if (new Date(lastModified) <= ims) {
          return body(null, {
            status: 304,
            headers: { "Last-Modified": lastModified },
          });
        }
      }
    }

    return body(output.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/avif",
        "Cache-Control": "public, max-age=300, must-revalidate",
        "ETag": etag,
        "Last-Modified": lastModified,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO NO-PLACEHOLDER (HIGH / LOW)
  // ─────────────────────────────────────────────────────────────────────────────
  const canvasWidth = Number(req.query("width"));
  const canvasHeight = Number(req.query("height"));
  const reqQuality = Number(req.query("quality"));
  const quality = !isNaN(reqQuality) && reqQuality > 0 ? reqQuality : QUALITY;

  // Ruta .cache
  const cacheDir = resolve(location, "assets", key, ".cache");
  if (!existsSync(cacheDir)) {
    await Deno.mkdir(cacheDir, { recursive: true });
    if (Deno.build.os === "windows") {
      await new Deno.Command("attrib", {
        args: ["+h", cacheDir],
      }).output();
    }
  }

  let cacheFile = `${file}_q${quality}`;
  if (canvasWidth || canvasHeight) {
    cacheFile += `_${canvasWidth || ""}x${canvasHeight || ""}`;
  }
  cacheFile += `_${mode}.avif`;

  const cachePath = resolve(cacheDir, cacheFile);
  if (version && existsSync(cachePath)) {
    await Deno.remove(cachePath);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXISTE EL ARCHIVO EN EL .cache?
  // ─────────────────────────────────────────────────────────────────────────────
  if (existsSync(cachePath)) {
    const cached = await Deno.readFile(cachePath);
    const etag = await calculateETag(cached);
    const headers: Record<string, string> = {
      "Content-Type": "image/avif",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "ETag": etag,
      "Last-Modified": lastModified,
    };

    if (!version) {
      if (req.header("if-none-match") === etag) {
        return body(null, { status: 304, headers });
      }
      if (req.header("if-modified-since")) {
        const ims = new Date(req.header("if-modified-since")!);
        if (new Date(lastModified) <= ims) {
          return body(null, { status: 304, headers });
        }
      }
    }

    return body(cached.buffer, {
      status: 200,
      headers,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NO EXISTE EL ARCHIVO => LO PROCESAMOS Y GUARDAMOS
  // ─────────────────────────────────────────────────────────────────────────────
  const convertAndReturn = async () => {
    const output = await transform
      .avif({
        quality,
        effort: EFFORT,
        lossless: LOSSLESS,
        chromaSubsampling: CHROMA,
      })
      .toBuffer();
    await Deno.writeFile(cachePath, output);

    const etag = await calculateETag(output);
    const headers: Record<string, string> = {
      "Content-Type": "image/avif",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "ETag": etag,
      "Last-Modified": lastModified,
    };

    if (!version) {
      if (req.header("if-none-match") === etag) {
        return body(null, { status: 304, headers });
      }
      if (req.header("if-modified-since")) {
        const ims = new Date(req.header("if-modified-since")!);
        if (new Date(lastModified) <= ims) {
          return body(null, { status: 304, headers });
        }
      }
    }

    return body(output.buffer as ArrayBuffer, { status: 200, headers });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Manejo de resize/extract/extend
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isNaN(canvasWidth) && !isNaN(canvasHeight)) {
    const { width, height } = await transform.metadata();
    if (!width || !height) throw new InternalServerError();

    if (width === canvasWidth && height === canvasHeight) {
      return convertAndReturn();
    }

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
    const { width } = await transform.metadata();
    if (width === canvasWidth) return convertAndReturn();
    transform.resize({ width: canvasWidth, fit: "cover" });
  } else if (!isNaN(canvasHeight)) {
    const { height } = await transform.metadata();
    if (height === canvasHeight) return convertAndReturn();
    transform.resize({ height: canvasHeight, fit: "cover" });
  }

  return convertAndReturn();
});
