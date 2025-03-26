import { isValidObjectId, validator } from 'deps';
import { BadRequestError } from 'errors';

export function validateFields<T>(...fields: (keyof T)[]) {
  return validator("json", (body: T) => {
    for (const field of fields) {
      if (body[field] === undefined || body[field] === null) {
        throw new BadRequestError("No se enviaron los parámetros obligatorios");
      }
    }

    return body;
  });
}

export function validateId() {
  return validator("query", (query) => {
    if (!isValidObjectId(query.id)) {
      throw new BadRequestError("El ID proporcionado no es válido");
    }

    return query;
  });
}

export function validateIdN() {
  return validator("query", (query) => {
    const idN = Number(query.idN);
    if (isNaN(idN) || idN < 1 || idN > 3) {
      throw new BadRequestError("Valor inválido");
    }

    return query;
  });
}
