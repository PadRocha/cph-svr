import { NotFoundError, UnauthorizedError } from "errors";
import { factory } from "factory";
import { ItemModel } from "models";

import { moveFilesToTrash } from "@utils/trash.ts";

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("ADMIN")) throw new UnauthorizedError();

  const location = get("location");
  const _id = req.query("id");
  const [data] = await ItemModel.getPopulate(_id);
  if (!data) throw new NotFoundError("Documento no encontrado");

  const status = Number(req.query("status"));
  const length = !isNaN(status) && status >= 0 && status < 5 ? 3 : 0;
  const data_file = await ItemModel.getBackInfo("_id", _id!);
  const { modifiedCount } = await ItemModel.updateOne({ _id }, {
    $set: {
      images: Array.from({ length }, (_, n) => ({ idN: n + 1, status })),
    },
  });
  if (!modifiedCount) throw new NotFoundError("Documento no encontrado");

  for (const { code, files } of data_file?.images) {
    moveFilesToTrash(location, code, files);
  }

  return json({ data, deletedStatus: data_file.status });
});
