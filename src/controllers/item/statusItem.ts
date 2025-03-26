import { BadRequestError, NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const _id = req.query("id");
  const idN = Number(req.query("idN"));
  const status = Number(req.query("status"));
  if (!isNaN(status)) {
    if (status < 0 || status > 5) throw new BadRequestError("Status inválido");

    const [data] = await ItemModel.getStatus(_id!, idN);
    if (!data) throw new NotFoundError("Documentado no encontrado");

    const { modifiedCount: keysSetted } = await ItemModel.updateOne(
      { _id },
      { $set: { "images.$[img].status": status } },
      { arrayFilters: [{ "img.idN": idN }] },
    );
    if (!keysSetted) {
      const { modifiedCount: keysPushed } = await ItemModel.updateOne(
        { _id, "images.idN": { $ne: idN } },
        { $push: { images: { idN, status } } },
      );

      if (!keysPushed) throw new NotFoundError("Documento no modificado");

      const [data] = await ItemModel.getStatus(_id!, idN);
      if (!data) throw new NotFoundError("Documentado no encontrado");
      return json({ data });
    }
    return json({ data });
  }

  const [data] = await ItemModel.getStatus(_id!, idN);
  if (!data) throw new NotFoundError("Documentado no encontrado");

  const { modifiedCount: keysPulled } = await ItemModel.updateOne({ _id }, {
    $pull: { images: { idN, status: { $gte: 0, $lte: 4 } } },
  });
  if (!keysPulled) throw new NotFoundError("Documento no modificado");
  return json({ data });
});
