import type { PipelineStage } from "mongoose";
import { InstructionModel } from 'models';

import {
    ComparisonOperator, Instruction, InstructionPatternData, ParsedResult, Pattern, PatternField,
    PatternType, ResultPipeline
} from '@interfaces/instruction.interface.ts';

/**
 * ParserPipeline
 * --------------
 * Unifica el parseo de la instrucción y la generación de etapas de pipeline ($match) con cacheo.
 * Se procesan solo las instrucciones dinámicas válidas; aquellas que no cumplen las reglas se pasan a la descripción.
 */
export class ParserPipeline {
  public static async getPipelineForInstruction(
    input?: string,
  ): Promise<ResultPipeline> {
    if (!input || !input.trim()) {
      return {
        parseResult: {
          keys: { include: [], exclude: [] },
          items: { include: [], exclude: [] },
          lines: { include: [], exclude: [] },
          brands: { include: [], exclude: [] },
          desc: "",
        },
        pipeline: [],
      };
    }

    // 1) Tokenizar la instrucción.
    const { tokens, desc } = this.tokenizeInput(input);
    const tokenKeys = tokens.map((tk) => tk.tokenStr);

    // 2) Consulta en lote a la BD.
    const docs = await InstructionModel.find({ token: { $in: tokenKeys } })
      .lean();
    const docsMap = new Map<string, Instruction>();
    for (const doc of docs) {
      docsMap.set(doc.token, doc);
    }

    // 3) Procesar cada token; si no se puede interpretar dinámicamente, se añade a la descripción.
    const parsePromises = tokens.map(async (tk) => {
      const tokenKey = tk.tokenStr;
      let processedDoc: Instruction | null = docsMap.get(tokenKey) ?? null;
      if (!processedDoc) {
        processedDoc = await this.parseAndStoreToken(tokenKey, tk.exclude);
      }
      return processedDoc;
    });
    const parseResults = await Promise.all(parsePromises);
    const parseArray: Array<
      Omit<Instruction, "token"> & { field: PatternField }
    > = [];
    // Recolectamos tokens que no fueron procesados dinámicamente.
    const nonDynamicTokens: string[] = [];
    for (let i = 0; i < parseResults.length; i++) {
      const res = parseResults[i];
      if (res) {
        parseArray.push({
          field: res.field as PatternField,
          type: res.type,
          patternData: res.patternData,
          matchStage: res.matchStage,
        });
      } else {
        nonDynamicTokens.push(tokens[i].tokenStr);
      }
    }

    // Se añade al desc los tokens que no se interpretaron como dinámicos.
    const finalDesc = (desc + " " + nonDynamicTokens.join(" ")).trim();

    // 4) Construir el ParsedResult final y el pipeline.
    const finalParsed: ParsedResult = {
      keys: { include: [], exclude: [] },
      items: { include: [], exclude: [] },
      lines: { include: [], exclude: [] },
      brands: { include: [], exclude: [] },
      desc: finalDesc,
    };

    const pipeline: PipelineStage[] = [];
    for (const { field, type, patternData, matchStage } of parseArray) {
      const exclude = type === "exclude";
      const pat = this.patternDataToPattern(patternData);
      if (exclude) {
        finalParsed[field].exclude.push(pat);
      } else {
        finalParsed[field].include.push(pat);
      }
      pipeline.push(matchStage);
    }

    return { parseResult: finalParsed, pipeline };
  }

  // -------------------------------------------------------------------------
  // PARSEO: Tokenización y procesamiento de tokens.
  // -------------------------------------------------------------------------
  private static tokenizeInput(
    input: string,
  ): { tokens: Array<{ tokenStr: string; exclude: boolean }>; desc: string } {
    const tokens: Array<{ tokenStr: string; exclude: boolean }> = [];
    let desc = "";
    const parts = input.match(/\w+:"[^"]+"|\w+:'[^']+'|\S+/g) || [];
    for (const part of parts) {
      let exclude = false;
      let val = part;
      if (val.startsWith("-")) {
        exclude = true;
        val = val.slice(1);
      }
      // Se excluyen aquellos que comienzan con corchetes y cuyo contenido (ITEM/ITEMS, KEY/KEYS, BRAND/BRANDS, LINE/LINES o ACC)
      // deben tratarse como parte de la descripción.
      if (/^\[(ITEMS?|KEYS?|BRANDS?|BRAND|LINES?|ACC)\]/i.test(val)) {
        // No se considera token dinámico; se añade a la descripción.
        desc += part + " ";
        continue;
      }
      if (this.isLikelyDynamic(val)) {
        tokens.push({ tokenStr: exclude ? `-${val}` : val, exclude });
      } else {
        desc += part + " ";
      }
    }
    return { tokens, desc: desc.trim().toLowerCase() };
  }

  // Se amplía para reconocer tokens que sean exactos (por ejemplo, 5-6 caracteres, 3 o 2-3) o que contengan ":" o "[...]"
  // Aquí se excluyen los tokens que comienzan con [ITEMS], [KEY], [BRANDS], [BRAND], [LINES] o [ACC] para que se traten como parte de la descripción.
  private static isLikelyDynamic(val: string): boolean {
    if (/^\[(ITEMS?|KEYS?|BRANDS?|BRAND|LINES?|ACC)\]/i.test(val)) return false;
    const fieldPatterns = [
      /^[A-Z0-9]{5,6}$/, // keys
      /^[A-Z0-9]{3}$/, // lines
      /^[A-Z0-9]{2,3}$/, // brands
    ];
    if (fieldPatterns.some((regex) => regex.test(val))) return true;
    return val.includes(":") || /\[.+\]/.test(val);
  }

  // Si no se especifica el campo, se determina en función del formato.
  private static determineField(value: string): PatternField {
    if (/^[A-Z0-9]{5,6}$/.test(value)) return "keys";
    if (/^[A-Z0-9]{3}$/.test(value)) return "lines";
    if (/^[A-Z0-9]{2,3}$/.test(value)) return "brands";
    return "items";
  }

  private static async parseAndStoreToken(
    rawToken: string,
    wasExclude: boolean,
  ): Promise<Instruction | null> {
    let exclude = wasExclude;
    let tokenBody = rawToken;
    if (rawToken.startsWith("-")) {
      exclude = true;
      tokenBody = rawToken.slice(1);
    }
    const parsed = this.parseSingleToken(tokenBody);
    if (!parsed) {
      // Si no se pudo parsear, forzamos a no ser dinámica.
      return null;
    }
    const { field, patternData } = parsed;
    const matchStage = this.buildStageFromData(field, patternData, exclude);
    const doc = await InstructionModel.create({
      token: rawToken,
      field,
      type: exclude ? "exclude" : "include",
      patternData,
      matchStage,
    });
    return doc.toObject();
  }

  /**
   * parseSingleToken
   *
   * Extrae el campo y la patternData del token.
   * - Si el token utiliza un prefijo (delimitado por corchetes) y el campo es "items", se valida que la parte restante cumpla con la estructura:
   *   comparación (ej. >0050), rango (ej. 1000<>1500) o valor numérico (1 a 4 dígitos).
   * - Para otros campos (line, brand, key) si se detecta corchetes se forzará a regex.
   * - Si hay más de un bloque de corchetes o la estructura no concuerda, se retorna null para tratar el token como descripción.
   */
  private static parseSingleToken(
    tokenStr: string,
  ): { field: PatternField; patternData: InstructionPatternData } | null {
    let field: PatternField | undefined;
    let tokenBody = tokenStr;
    const fieldMatchQuoted = tokenStr.match(/^(\w+):["'](.+)["']$/);
    if (fieldMatchQuoted) {
      const alias = fieldMatchQuoted[1].toLowerCase();
      field = this.aliasMap[alias];
      tokenBody = fieldMatchQuoted[2];
    } else {
      const fieldMatch = tokenStr.match(/^(\w+):(.+)$/);
      if (fieldMatch) {
        const alias = fieldMatch[1].toLowerCase();
        if (this.aliasMap[alias]) {
          field = this.aliasMap[alias];
          tokenBody = fieldMatch[2];
        }
      }
    }
    if (!field) {
      field = this.determineField(tokenBody);
    }
    // Si el campo NO es "items" y contiene corchetes, forzamos a tratarlo como regex.
    if (field !== "items" && /^\[[^\]]+\].+$/.test(tokenBody)) {
      return { field, patternData: { patternType: "regex", value: tokenBody } };
    }
    // Para tokens de brands, lines o keys en formato exacto que tengan corchetes (ej. brand:[AC1]),
    // se extrae el contenido y se interpreta como regex.
    if (
      (field === "brands" || field === "lines" || field === "keys") &&
      tokenStr.match(/^\w+:\[[^\]]+\]$/)
    ) {
      const m = tokenStr.match(/^\w+:\[([^\]]+)\]$/);
      if (m) {
        return { field, patternData: { patternType: "regex", value: m[1] } };
      }
    }
    // Extraer prefijo si existe (sólo para items).
    let keyPrefix: string | undefined;
    const prefixMatch = tokenBody.match(/^\[([^\]]+)\](.+)$/);
    if (prefixMatch) {
      if (field !== "items") return null;
      keyPrefix = prefixMatch[1];
      const extracted = prefixMatch[2];
      // Si la parte extraída cumple con comparación, rango o valor numérico, se continúa el procesamiento normal.
      if (
        /^([><]=?\d+)$/.test(extracted) ||
        /^\d+<>\d+$/.test(extracted) ||
        /^\d{1,4}$/.test(extracted)
      ) {
        tokenBody = extracted;
      } else if (/[*^$\\.+?]/.test(extracted)) {
        // Si contiene metacaracteres de regex (pero no es numérico), se devuelve el token completo sin separar el prefijo.
        // Esto hará que en el parse result se conserve el valor original y en el pipeline se use el valor extraído.
        return {
          field,
          patternData: {
            patternType: "regex",
            value: tokenStr,
            // Propiedad adicional para construir el pipeline: se usará el contenido sin el prefijo.
            extractedValue: extracted,
          },
        };
      } else {
        return null;
      }
    }
    // Intentar detectar comparación.
    const compMatch = tokenBody.match(/^([><]=?)(.+)$/);
    if (compMatch) {
      const opMap: Record<string, ComparisonOperator> = {
        ">": ComparisonOperator.GT,
        "<": ComparisonOperator.LT,
        ">=": ComparisonOperator.GTE,
        "<=": ComparisonOperator.LTE,
      };
      const op = opMap[compMatch[1]];
      let val = compMatch[2];
      if (val.length < 4) val = val.padStart(4, "0");
      return {
        field,
        patternData: {
          patternType: "comparison",
          keyPrefix,
          operator: op,
          value: val,
        },
      };
    }
    // Intentar detectar rango.
    const rangeMatch = tokenBody.match(/^(.+)<>(.+)$/);
    if (rangeMatch) {
      let s = rangeMatch[1];
      let e = rangeMatch[2];
      if (s.length < 4) s = s.padStart(4, "0");
      if (e.length < 4) e = e.padStart(4, "0");
      return {
        field,
        patternData: { patternType: "range", keyPrefix, start: s, end: e },
      };
    }
    // Si contiene caracteres especiales de regex o está entre comillas, se fuerza regex.
    if (
      /[*^$]/.test(tokenBody) || /^".+"$/.test(tokenBody) ||
      /^'.+'$/.test(tokenBody)
    ) {
      const regBody = tokenBody.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      return {
        field,
        patternData: { patternType: "regex", keyPrefix, value: regBody },
      };
    }
    // Caso contrario, tratar como literal value.
    // Además, para tokens sin prefijo, validamos la longitud para keys o items.
    const literal = tokenBody.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (field === "keys" && !/^[A-Z0-9]{5,6}$/.test(literal)) return null;
    if (field === "items" && !/^\d{1,4}$/.test(literal)) {
      // Si es items pero no cumple la longitud numérica y no tiene keyPrefix, se interpreta como parte de la descripción.
      return null;
    }
    return {
      field,
      patternData: { patternType: "value", keyPrefix, value: literal },
    };
  }

  // -------------------------------------------------------------------------
  // CONSTRUCCIÓN DEL MATCH STAGE
  // -------------------------------------------------------------------------
  private static buildStageFromData(
    field: PatternField,
    patternData: InstructionPatternData,
    exclude: boolean,
  ): PipelineStage {
    const posExpr = this.createPositiveExpr(field, patternData);
    if (exclude) {
      return { $match: { $nor: [posExpr] } };
    } else {
      return { $match: posExpr };
    }
  }

  private static createPositiveExpr(
    field: PatternField,
    pd: InstructionPatternData,
  ): PipelineStage.Match["$match"] {
    switch (field) {
      case "items":
        return this.buildItemsExpr(pd);
      case "keys":
        return this.buildKeysExpr(pd);
      case "lines":
        return this.buildLineExpr(pd);
      case "brands":
        return this.buildBrandExpr(pd);
    }
  }

  // Para items: se atiende el caso especial si se extrajo un valor (cuando la parte tras el prefijo no es numérica).
  private static buildItemsExpr(
    pd: InstructionPatternData,
  ): PipelineStage.Match["$match"] {
    if ("extractedValue" in pd) {
      // Se aplica el match únicamente sobre "$code" usando el valor extraído.
      return {
        $match: {
          $expr: {
            $regexMatch: {
              input: "$code",
              regex: pd.extractedValue,
              options: "i",
            },
          },
        },
      };
    }
    if (pd.keyPrefix) {
      const prefixExpr = {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$key.line.code", "$key.brand.code"] },
            regex: pd.keyPrefix,
            options: "i",
          },
        },
      };
      if (pd.patternType === "comparison") {
        return {
          $expr: {
            $and: [
              prefixExpr.$expr,
              { [this.mapOperator(pd.operator!)]: ["$code", pd.value] },
            ],
          },
        };
      } else if (pd.patternType === "range") {
        return {
          $expr: {
            $and: [
              prefixExpr.$expr,
              { $gte: ["$code", pd.start] },
              { $lte: ["$code", pd.end] },
            ],
          },
        };
      } else if (pd.patternType === "regex") {
        return {
          $expr: {
            $and: [
              prefixExpr.$expr,
              {
                $regexMatch: {
                  input: "$code",
                  regex: pd.value,
                  options: "i",
                },
              },
            ],
          },
        };
      } else if (pd.patternType === "value") {
        return this.combinePrefixWithCode(prefixExpr, pd, "$code");
      }
    }
    // Sin keyPrefix: procesar según tipo
    switch (pd.patternType) {
      case "comparison":
        return {
          $expr: { [this.mapOperator(pd.operator!)]: ["$code", pd.value] },
        };
      case "range":
        return {
          $expr: {
            $and: [{ $gte: ["$code", pd.start] }, { $lte: ["$code", pd.end] }],
          },
        };
      case "regex":
      case "value": {
        const pattern: Pattern = this.patternDataToPattern(pd);
        return this.buildExprWithoutPrefix(pattern, true)!;
      }
      default:
        return {};
    }
  }

  private static buildKeysExpr(
    pd: InstructionPatternData,
  ): PipelineStage.Match["$match"] {
    const pattern: Pattern = this.patternDataToPattern(pd);
    return this.buildExprWithoutPrefix(pattern, false)!;
  }

  private static buildLineExpr(
    pd: InstructionPatternData,
  ): PipelineStage.Match["$match"] {
    const path = "$key.line.code";
    return this.buildSingleFieldExpr(pd, path);
  }

  private static buildBrandExpr(
    pd: InstructionPatternData,
  ): PipelineStage.Match["$match"] {
    const path = "$key.brand.code";
    return this.buildSingleFieldExpr(pd, path);
  }

  private static buildExprWithoutPrefix(
    pattern: Pattern,
    isItemFull: boolean,
  ): PipelineStage.Match["$match"] | null {
    const input = isItemFull
      ? ["$key.line.code", "$key.brand.code", "$code"]
      : ["$key.line.code", "$key.brand.code"];
    switch (pattern.type) {
      case PatternType.VALUE:
        return {
          $expr: {
            $eq: [{ $concat: input }, pattern.value],
          },
        };
      case PatternType.REGEX:
        return {
          $expr: {
            $regexMatch: {
              input: { $concat: input },
              regex: pattern.value,
              options: "i",
            },
          },
        };
      case PatternType.COMPARISON:
        return {
          $expr: {
            [this.mapOperator(pattern.operator)]: [
              { $concat: input },
              pattern.value,
            ],
          },
        };
      case PatternType.RANGE:
        return {
          $expr: {
            $and: [
              { $gte: [{ $concat: input }, pattern.start] },
              { $lte: [{ $concat: input }, pattern.end] },
            ],
          },
        };
      default:
        return null;
    }
  }

  private static buildSingleFieldExpr(
    pd: InstructionPatternData,
    path: string,
  ): PipelineStage.Match["$match"] {
    if (pd.patternType === "comparison") {
      return { $expr: { [this.mapOperator(pd.operator!)]: [path, pd.value] } };
    } else if (pd.patternType === "range") {
      return {
        $expr: { $and: [{ $gte: [path, pd.start] }, { $lte: [path, pd.end] }] },
      };
    } else if (pd.patternType === "regex") {
      return {
        $expr: { $regexMatch: { input: path, regex: pd.value, options: "i" } },
      };
    } else if (pd.patternType === "value") {
      return { $expr: { $eq: [path, pd.value] } };
    }
    return {};
  }

  // Para tokens de items con prefijo, se combina el prefijo con la comparación sobre $code.
  private static combinePrefixWithCode(
    prefixExpr: PipelineStage.Match["$match"],
    pd: InstructionPatternData,
    codeField: string,
  ): PipelineStage.Match["$match"] {
    if (pd.patternType === "regex") {
      return {
        $expr: {
          $and: [
            prefixExpr.$expr,
            {
              $regexMatch: {
                input: codeField,
                regex: pd.value,
                options: "i",
              },
            },
          ],
        },
      };
    } else if (pd.patternType === "value") {
      return {
        $expr: {
          $and: [prefixExpr.$expr, { $eq: [codeField, pd.value] }],
        },
      };
    }
    return {};
  }

  private static mapOperator(op: string): string {
    switch (op) {
      case ">":
        return "$gt";
      case "<":
        return "$lt";
      case ">=":
        return "$gte";
      case "<=":
        return "$lte";
      default:
        return "$eq";
    }
  }

  private static patternDataToPattern(pd: InstructionPatternData): Pattern {
    const base = pd.keyPrefix ? { keyPrefix: pd.keyPrefix } : {};
    switch (pd.patternType) {
      case "comparison":
        return {
          type: PatternType.COMPARISON,
          operator: pd.operator! as ComparisonOperator,
          value: pd.value!,
          ...base,
        };
      case "range":
        return {
          type: PatternType.RANGE,
          start: pd.start!,
          end: pd.end!,
          ...base,
        };
      case "regex":
        return { type: PatternType.REGEX, value: pd.value!, ...base };
      default:
        return { type: PatternType.VALUE, value: pd.value!, ...base };
    }
  }

  private static aliasMap: Record<string, PatternField> = {
    key: "keys",
    keys: "keys",
    item: "items",
    items: "items",
    brand: "brands",
    brands: "brands",
    line: "lines",
    lines: "lines",
    clave: "keys",
    claves: "keys",
    ítem: "items",
    ítems: "items",
    artículo: "items",
    articulo: "items",
    artículos: "items",
    articulos: "items",
    producto: "items",
    productos: "items",
    línea: "lines",
    linea: "lines",
    líneas: "lines",
    lineas: "lines",
    marca: "brands",
    marcas: "brands",
  };
}
