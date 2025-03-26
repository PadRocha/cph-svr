import type { StatusInfo } from "@interfaces/item.interface.ts";
import { pipeline } from 'aggregate';
import { UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { ParserPipeline } from '@utils/pipeline_builder.ts';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const aggregate = ItemModel.aggregate<StatusInfo>();
  const { parseResult: { desc }, pipeline: search } = await ParserPipeline
    .getPipelineForInstruction(req.query("search"));
  if (desc) aggregate.match({ $text: { $search: desc } });

  const status = Number(req.query("status"));
  if (!isNaN(status) && status >= 0 && status <= 5) {
    aggregate.match({ "images.status": status });
  }

  const [data] = await aggregate
    .lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .append(...search)
    .facet(pipeline.FACET.INFO)
    .project(pipeline.PROJECT.INFO_COMPLETE);
  return json({ data });
});
