import { BadRequestError, UnauthorizedError } from 'errors';
import { factory } from 'factory';
import { ItemModel, KeyModel } from 'models';

import { InstructionParser, ParsedResult, PatternType } from '@utils/parser.ts';

export default factory.createHandlers(async ({ req, get, json }) => {
  if (!get("user").roleIncludes("READ", "WRITE", "EDIT", "GRANT", "ADMIN")) {
    throw new UnauthorizedError();
  }

  const { result } = new InstructionParser(req.query("search"));
  const itemsPatterns = filterValue(result, "items");
  const keyPatterns = filterValue(result, "keys");

  if (itemsPatterns.length < 1 && keyPatterns.length < 1) {
    throw new BadRequestError("Parámetros no enviados o inválidos");
  }

  const items = new Set();
  const keys = new Set();

  for (const pattern of itemsPatterns) {
    if (!("value" in pattern)) continue;
    const [_, key, code] = pattern.value.match(
      /^([A-Z0-9]{6}|[A-Z0-9]{5}\s)([A-Z0-9]{4})$/i,
    )!;
    const docs = await ItemModel.getFuzzy(key, code);
    for (const { code } of docs) items.add(code);
  }

  for (const pattern of keyPatterns) {
    if (!("value" in pattern)) continue;
    const [_, key] = pattern.value.match(/^([A-Z0-9]{5,6})$/i)!;
    const docs = await KeyModel.getFuzzy(key);
    for (const { code } of docs) keys.add(code);
  }

  return json({ data: { items: Array.from(items), keys: Array.from(keys) } });
});

/**
 * Filters the values from the parsed result based on the specified type.
 *
 * @param result - The parsed result object containing items or keys.
 * @param type - The type of values to filter, either "items" or "keys".
 * @returns An array of filtered values where the type matches `PatternType.VALUE`.
 */
function filterValue(result: ParsedResult, type: "items" | "keys") {
  return result[type].include.filter(({ type }) => type === PatternType.VALUE);
}
