import { isValidObjectId } from 'deps';
import { model } from 'mongoose';

export function validateExistence(target_model: string) {
  return {
    async validator(_id: string) {
      if (!isValidObjectId(_id)) return false;

      return await model(target_model)
        .exists({ _id })
        .then((doc) => !!doc)
        .catch(() => false);
    },
    message({ value }: { value: string }) {
      return `${target_model} "${value}" no existe.`;
    },
    msg: `Invalid ${target_model}`,
  };
}
