import { existsSync, resolve } from 'deps';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { formatDateTime } from '@utils/formatDate.ts';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id")!;
  const idN = Number(req.query("idN"));
  const location = get("location");
  const { buffer, ext } = get("image");
  const [data_update] = await ItemModel.getImage(_id, idN);
  if (data_update) {
    const oldFileName = `${data_update.file}.${data_update.ext}`;
    const oldPath = resolve(location, "assets", data_update.key, oldFileName);
    if (!existsSync(oldPath)) throw new NotFoundError("File not found");

    const trashPath = resolve(
      location,
      "trash",
      `deleted-${formatDateTime()}-${oldFileName}`,
    );
    Deno.renameSync(oldPath, trashPath);

    const newFileName = `${data_update.file}.${ext}`;
    const newPath = resolve(location, "assets", data_update.key, newFileName);
    Deno.writeFileSync(newPath, buffer);

    if (data_update.ext !== ext) {
      const { modifiedCount } = await ItemModel.updateOne(
        { _id },
        { $set: { "images.$[img].ext": ext } },
        { arrayFilters: [{ "img.idN": idN }] },
      );
      if (!modifiedCount) throw new NotFoundError("Error updating image");
      return json({ data: { ...data_update, ext } });
    }

    return json({ data: data_update });
  }

  const { modifiedCount } = await ItemModel.updateOne(
    { _id },
    { $set: { "images.$[img].status": 5, "images.$[img].ext": ext } },
    { arrayFilters: [{ "img.idN": idN }] },
  );
  if (!modifiedCount) throw new NotFoundError("Error updating image");

  const [data_set] = await ItemModel.getImage(_id, idN);
  if (!data_set) throw new NotFoundError("Image not found");

  const dir = resolve(location, "assets", data_set.key);
  if (!existsSync(dir)) Deno.mkdirSync(dir, { recursive: true });

  const fileName = `${data_set.file}.${ext}`;
  const filePath = resolve(dir, fileName);
  Deno.writeFileSync(filePath, buffer);

  return json({ data: data_set });
});
