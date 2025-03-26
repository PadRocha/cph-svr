import { existsSync, resolve } from 'deps';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { formatDateTime } from '@utils/formatDate.ts';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id")!;
  const idN = Number(req.query("idN"));
  const location = get("location");
  const [data] = await ItemModel.getImage(_id, idN);
  if (!data) throw new NotFoundError("Documento no encontrado");

  const { modifiedCount } = await ItemModel.updateOne({ _id }, {
    $pull: { images: { idN, status: 5 } },
  });
  if (!modifiedCount) throw new NotFoundError("Documento no modificado");

  const path = resolve(location, "assets", data.key, data.file);
  if (existsSync(path)) throw new NotFoundError("Imagen no encontrada");

  const new_path = resolve(
    location,
    "trash",
    `deleted-${formatDateTime()}-${data.file}`,
  );
  Deno.renameSync(path, new_path);

  return json({ data });
});
