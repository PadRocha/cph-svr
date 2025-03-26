import type { PopulatedItem } from "@interfaces/item.interface.ts";
import { pipeline } from 'aggregate';
import { NotFoundError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel } from 'models';

import { ParserPipeline } from '@utils/pipeline_builder.ts';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const aggregate = ItemModel.aggregate<PopulatedItem>();
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

  aggregate.lookup(pipeline.LOOKUP.KEY).unwind("$key")
    .lookup(pipeline.LOOKUP.KEY_LINE).unwind("$key.line")
    .lookup(pipeline.LOOKUP.KEY_BRAND).unwind("$key.brand")
    .append(...search)
    .addFields({
      sort_key: {
        $let: {
          vars: {
            // Calculamos el score invertido y lo convertimos a cadena, usando $ifNull para manejar la ausencia de $score
            si: {
              $toString: {
                $subtract: [10000, { $ifNull: ["$score", 0] }],
              },
            },
            // Calculamos cuántos caracteres le faltan para llegar a 4
            pad_length: {
              $subtract: [
                4,
                {
                  $strLenCP: {
                    $toString: {
                      $subtract: [10000, { $ifNull: ["$score", 0] }],
                    },
                  },
                },
              ],
            },
          },
          in: {
            $concat: [
              // Usamos $switch para determinar el padding según la cantidad de ceros necesarios
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$$pad_length", 1] }, then: "0" },
                    { case: { $eq: ["$$pad_length", 2] }, then: "00" },
                    { case: { $eq: ["$$pad_length", 3] }, then: "000" },
                  ],
                  default: "",
                },
              },
              "$$si",
              "$key.line.code",
              "$key.brand.code",
              "$code",
            ],
          },
        },
      },
    })
    .append({
      $setWindowFields: {
        sortBy: { sort_key: 1 },
        output: { rowNumber: { $documentNumber: {} } },
      },
    });

  const direction = req.query("direction") === "previous" ? "$lt" : "$gt";
  const code = req.query("code")!.toUpperCase();
  const [current] = await ItemModel.aggregate<{ rowNumber: number }>()
    .append(...aggregate.pipeline())
    .match({
      $expr: {
        $eq: [
          {
            $concat: [
              "$key.line.code",
              "$key.brand.code",
              "$code",
            ],
          },
          code,
        ],
      },
    })
    .project({ rowNumber: 1, _id: 0 });
  if (!current) throw new NotFoundError("Documento no encontrado");

  const [data] = await aggregate
    .match({ rowNumber: { [direction]: current.rowNumber } })
    .sort({ rowNumber: direction === "$gt" ? 1 : -1 })
    .limit(1)
    .project(pipeline.PROJECT.ITEM);
  if (!data) throw new NotFoundError("Documento no encontrado");

  return json({ data });
});
