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
  if (isNaN(status)) throw new BadRequestError("Status no definido o inválido");

  // Caso especial: eliminar imagen (status === -1)
  if (status === -1) {
    const { modifiedCount: deleted } = await ItemModel.updateOne(
      { _id },
      { $pull: { images: { idN: { $eq: idN } } } },
    );
    if (!deleted) throw new NotFoundError("Imagen no eliminada");

    const [data] = await ItemModel.getStatus(_id!, idN);
    return json({ data });
  }

  // Validación de rango
  if (status < 0 || status > 5) throw new BadRequestError("Status inválido");

  // Intentar actualizar si la imagen ya existe
  const { modifiedCount: updated } = await ItemModel.updateOne(
    { _id },
    { $set: { "images.$[img].status": status } },
    { arrayFilters: [{ "img.idN": idN }] },
  );
  if (!updated) {
    // Si no se actualizó, agregarla como nueva imagen
    const { modifiedCount: created } = await ItemModel.updateOne(
      { _id },
      { $push: { images: { idN, status } } },
    );
    if (!created) throw new NotFoundError("Imagen no agregada");
  }

  const [data] = await ItemModel.getStatus(_id!, idN);
  if (!data) {
    throw new NotFoundError("Documento no encontrado tras la operación");
  }

  return json({ data });
});
