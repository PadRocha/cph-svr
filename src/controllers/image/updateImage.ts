import { setup } from "config";
import { existsSync, resolve } from "deps";
import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel } from "models";

import { formatDateTime } from "@utils/formatDate.ts";

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id")!;
  const idN = Number(req.query("idN"));
  const location = get("location");
  const { buffer } = get("image");
  const ext = setup.IMAGE.EXT;
  // Primero, consultamos si ya existe la imagen con (idN, status=5)
  const [dataUpdate] = await ItemModel.getImage(_id, idN);
  if (dataUpdate) {
    // Caso A: La imagen ya existe (con idN y status=5) => se reemplaza el archivo anterior
    const oldFileName = `${dataUpdate.file}.${ext}`;
    const oldPath = resolve(location, "assets", dataUpdate.key, oldFileName);
    if (!existsSync(oldPath)) throw new NotFoundError("File not found");

    const trashPath = resolve(
      location,
      "trash",
      `deleted-${formatDateTime()}-${oldFileName}`,
    );
    Deno.renameSync(oldPath, trashPath);

    const newFileName = `${dataUpdate.file}.${ext}`;
    const newPath = resolve(location, "assets", dataUpdate.key, newFileName);
    Deno.writeFileSync(newPath, buffer);

    return json({ data: dataUpdate });
  }
  // Caso B: No existe el subdocumento con (idN, status=5)
  // Se intenta actualizar a status=5 algún subdocumento que tenga ese idN
  const { modifiedCount: updated } = await ItemModel.updateOne(
    { _id, "images.idN": idN },
    { $set: { "images.$[img].status": 5 } },
    { arrayFilters: [{ "img.idN": idN }] },
  );
  if (!updated) {
    // Caso C: No existía ningún subdocumento con ese idN; se hace push de un nuevo objeto a images
    const { modifiedCount: pushed } = await ItemModel.updateOne(
      { _id },
      { $push: { images: { idN, status: 5 } } },
    );
    if (!pushed) throw new NotFoundError("Documento no encontrado");
  }
  // Se vuelve a obtener la imagen con idN, ahora con status=5 (ya actualizada o creada)
  const [data] = await ItemModel.getImage(_id, idN);
  if (!data) throw new NotFoundError("Image not found after set/push");
  // Se crea la carpeta (assets/key) si no existe
  const dir = resolve(location, "assets", data.key);
  if (!existsSync(dir)) Deno.mkdirSync(dir, { recursive: true });
  // Se arma la ruta final y se guarda el archivo con la extensión definida en config
  const fileName = `${data.file}.${ext}`;
  const filePath = resolve(dir, fileName);
  Deno.writeFileSync(filePath, buffer);

  return json({ data });
});
