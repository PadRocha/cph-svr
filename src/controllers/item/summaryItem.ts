import type { PopulatedItem, StatusInfo } from "@interfaces/item.interface.ts";
import { pipeline } from 'aggregate';
import { setup } from 'config';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { ParserPipeline } from '@utils/pipeline_builder.ts';

interface Answer {
  data: PopulatedItem[];
  totalDocs: number;
  status: StatusInfo;
  success: number;
}

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }
  const aggregate = ItemModel.aggregate<Answer>();
  const { parseResult: { desc }, pipeline: search } = await ParserPipeline
    .getPipelineForInstruction(req.query("search"));
  if (desc) {
    aggregate.match({ $text: { $search: desc } });
    aggregate.addFields({ score: { $meta: "textScore" } });
  }

  const imgStatus = Number(req.query("status"));
  if (!isNaN(imgStatus) && imgStatus >= 0 && imgStatus <= 5) {
    aggregate.match({ "images.status": imgStatus });
  }

  /** Página fijada siempre a 1 por diseño del endpoint summaryItem */
  const page = 1;
  const limit = setup.LIMIT.ITEM;
  const [{ data, totalDocs, status, success }] = await aggregate
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .append(...search)
    .facet({
      data: [
        {
          $sort: desc
            ? { score: -1, "key.line.code": 1, "key.brand.code": 1, code: 1 }
            : { "key.line.code": 1, "key.brand.code": 1, code: 1 },
        },
        { $limit: limit },
        { $project: pipeline.PROJECT.ITEM },
      ],
      total: [{ $count: "count" }],
      ...pipeline.FACET.INFO,
    })
    .project({
      data: 1,
      totalDocs: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
      ...pipeline.PROJECT.INFO_COMPLETE,
    });
  if (data.length < 1) throw new NotFoundError("No se encontraron docs");

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = totalPages > page;
  return json({
    data,
    metadata: {
      totalDocs,
      limit,
      page,
      nextPage: hasNextPage ? 2 : null,
      prevPage: null,
      hasNextPage,
      hasPrevPage: false,
      totalPages,
      status,
      success,
    },
  });
});
