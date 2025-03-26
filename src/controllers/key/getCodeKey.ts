import { pipeline } from 'aggregate';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { KeyModel } from 'models';

//TODO: En proceso
export default factory.createHandlers(async ({ get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  // if (!$regex)
  //   return res.status(400).send({
  //     message: 'Client has not sent params'
  //   });
  const [data] = await KeyModel.aggregate<{ codes: string[] }>()
    .lookup(pipeline.LOOKUP.LINE)
    .unwind("$line")
    .lookup(pipeline.LOOKUP.BRAND)
    .unwind("$brand")
    .project({
      code: {
        $concat: ["$line.code", "$brand.code"],
      },
    })
    // .match({
    //   code: {
    //     $regex,
    //     $options: 'i'
    //   }
    // })
    .sort("code")
    .group({
      _id: null,
      codes: { $push: "$code" },
    });
  if (!data?.codes || !Array.isArray(data.codes) || data.codes.length < 1) {
    throw new NotFoundError();
  }

  return json({ data: data.codes });
});
