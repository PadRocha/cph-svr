/**
 * @module utils
 * @description Este módulo proporciona la clase `SearchPipelineBuilder` para construir pipelines de búsqueda
 * en MongoDB utilizando los resultados parseados de instrucciones. La clase traduce patrones de inclusión
 * y exclusión en condiciones de búsqueda que se pueden utilizar en consultas de MongoDB.
 */

import { PipelineStage } from 'mongoose';

import { ComparisonOperator, ParsedResult, Pattern, PatternType } from '@utils/parser.ts';

/**
 * Clase `SearchPipelineBuilder` que construye un pipeline de búsqueda basado en patrones parseados.
 *
 * ## Descripción General
 *
 * La clase `SearchPipelineBuilder` toma un objeto `ParsedResult` que contiene patrones de inclusión y exclusión
 * para diferentes campos (`keys`, `items`, `lines`, `brands`) y genera un arreglo de etapas de pipeline
 * (`PipelineStage[]`) que se puede utilizar en una consulta de MongoDB. Cada patrón se traduce en condiciones
 * específicas utilizando operadores de MongoDB como `$and`, `$or`, `$nor`, `$eq`, `$regexMatch`, entre otros.
 *
 * ## Métodos Principales
 *
 * - `buildSearchPipeline`: Método público que inicia la construcción del pipeline de búsqueda.
 * - `buildFieldCondition`: Método privado que construye las condiciones de búsqueda para un campo específico.
 * - `buildExpr`: Método privado que construye la expresión de búsqueda para un patrón dado.
 * - Métodos específicos para construir expresiones para `items`, `keys`, `lines` y `brands`.
 */
export class SearchPipelineBuilder {
  /**
   * Construye el pipeline de búsqueda basado en un objeto `ParsedResult`.
   *
   * Este método itera sobre los patrones incluidos y excluidos en cada campo de `ParsedResult` y
   * genera las condiciones correspondientes que se agregan al pipeline de MongoDB.
   *
   * @param {ParsedResult} parsed - Objeto que contiene los patrones de inclusión y exclusión para cada campo.
   * @returns {PipelineStage[]} Arreglo de etapas del pipeline de MongoDB que representan las condiciones de búsqueda.
   *
   * @example
   * const builder = new SearchPipelineBuilder();
   * const parsedResult: ParsedResult = { keys: { include: [], exclude: [] }, items: { include: [], exclude: [] }, ... };
   * const pipeline = builder.buildSearchPipeline(parsedResult);
   */
  public buildSearchPipeline(parsed: ParsedResult): PipelineStage[] {
    const pipeline: PipelineStage[] = [];
    const andConditions: Record<string, unknown>[] = [];

    const keysCondition = this.buildFieldCondition(parsed.keys, "keys");
    if (keysCondition) andConditions.push(keysCondition);

    const itemsCondition = this.buildFieldCondition(parsed.items, "items");
    if (itemsCondition) andConditions.push(itemsCondition);

    const linesCondition = this.buildFieldCondition(parsed.lines, "lines");
    if (linesCondition) andConditions.push(linesCondition);

    const brandsCondition = this.buildFieldCondition(parsed.brands, "brands");
    if (brandsCondition) andConditions.push(brandsCondition);

    if (andConditions.length > 0) {
      pipeline.push({
        $match: {
          $and: andConditions,
        },
      });
    }

    return pipeline;
  }

  /**
   * Construye las condiciones de búsqueda para un campo específico basado en los patrones de inclusión y exclusión.
   *
   * @param {Object} fieldPatterns - Objeto que contiene arreglos de patrones de inclusión y exclusión.
   * @param {"keys" | "items" | "lines" | "brands"} fieldName - Nombre del campo para el cual se construyen las condiciones.
   * @returns {Record<string, unknown> | null} Objeto que representa las condiciones de búsqueda para el campo, o `null` si no hay condiciones.
   *
   * @example
   * const conditions = builder.buildFieldCondition(parsed.keys, "keys");
   */
  private buildFieldCondition(
    fieldPatterns: { include: Pattern[]; exclude: Pattern[] },
    fieldName: "keys" | "items" | "lines" | "brands",
  ): Record<string, unknown> | null {
    const { include, exclude } = fieldPatterns;

    if (include.length === 0 && exclude.length === 0) {
      return null;
    }

    const conditions: Record<string, unknown> = {};

    // -- includes => $or
    if (include.length > 0) {
      const orClauses: Record<string, unknown>[] = include
        .map((pattern) => this.buildExpr(pattern, fieldName))
        .filter((expr) => expr !== null) as Record<string, unknown>[];
      if (orClauses.length > 0) {
        conditions.$or = orClauses;
      }
    }

    // -- excludes => $nor
    if (exclude.length > 0) {
      const norClauses: Record<string, unknown>[] = exclude
        .map((pattern) => this.buildExpr(pattern, fieldName))
        .filter((expr) => expr !== null) as Record<string, unknown>[];
      if (norClauses.length > 0) {
        conditions.$nor = norClauses;
      }
    }

    return conditions;
  }

  /**
   * Construye la expresión de búsqueda para un patrón dado en un campo específico.
   *
   * Dependiendo del campo (`keys`, `items`, `lines`, `brands`), delega la construcción de la expresión a métodos específicos.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda.
   * @param {"keys" | "items" | "lines" | "brands"} fieldName - Nombre del campo al que se aplica el patrón.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda, o `null` si no se pudo construir.
   *
   * @example
   * const expr = builder.buildExpr(pattern, "items");
   */
  private buildExpr(
    pattern: Pattern,
    fieldName: "keys" | "items" | "lines" | "brands",
  ): Record<string, unknown> | null {
    try {
      switch (fieldName) {
        case "items":
          return this.buildItemExpr(pattern);
        case "keys":
          return this.buildKeyExpr(pattern);
        case "lines":
          return this.buildLineExpr(pattern);
        case "brands":
          return this.buildBrandExpr(pattern);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Construye la expresión de búsqueda para patrones aplicados al campo `items`.
   *
   * Maneja patrones con prefijos de clave (`keyPrefix`) y diferentes tipos de patrones (`value`, `regex`, `comparison`, `range`).
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda para `items`.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda para `items`, o `null` si no se pudo construir.
   *
   * @example
   * const itemExpr = builder.buildItemExpr(pattern);
   */
  private buildItemExpr(pattern: Pattern): Record<string, unknown> | null {
    const prefix = pattern.keyPrefix;

    if (prefix) {
      // Con prefix => line+brand y $code
      const keyExpr = this.buildPrefixExpr(prefix);
      const mainExpr = this.buildMainExpr(pattern);

      if (!keyExpr || !mainExpr) return null;

      // extraemos la parte interna de cada uno y combinamos en un solo $expr
      const keyPart = keyExpr.$expr;
      const mainPart = mainExpr.$expr;
      if (!keyPart || !mainPart) return null;

      // Unificamos en un único $expr con $and
      return {
        $expr: {
          $and: [keyPart, mainPart],
        },
      };
    }

    // Sin prefix => split según sea comparación/rango o valor/regex
    switch (pattern.type) {
      case PatternType.COMPARISON:
      case PatternType.RANGE:
        // Comparaciones y rangos => $code
        return this.buildMainExpr(pattern);

      case PatternType.VALUE:
      case PatternType.REGEX:
        // Valor o regex => concat(line+brand+code)
        return this.buildExprWithoutPrefix(pattern, /* isItemFull= */ true);

      default:
        return null;
    }
  }

  /**
   * Construye la expresión de búsqueda para patrones aplicados al campo `keys`.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda para `keys`.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda para `keys`, o `null` si no se pudo construir.
   *
   * @example
   * const keyExpr = builder.buildKeyExpr(pattern);
   */
  private buildKeyExpr(pattern: Pattern): Record<string, unknown> | null {
    return this.buildExprWithoutPrefix(pattern, /* isItemFull= */ false);
  }

  /**
   * Construye la expresión de búsqueda para patrones aplicados al campo `lines`.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda para `lines`.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda para `lines`, o `null` si no se pudo construir.
   *
   * @example
   * const lineExpr = builder.buildLineExpr(pattern);
   */
  private buildLineExpr(pattern: Pattern): Record<string, unknown> | null {
    return this.buildSingleFieldExpr(pattern, "$key.line.code");
  }

  /**
   * Construye la expresión de búsqueda para patrones aplicados al campo `brands`.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda para `brands`.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda para `brands`, o `null` si no se pudo construir.
   *
   * @example
   * const brandExpr = builder.buildBrandExpr(pattern);
   */
  private buildBrandExpr(pattern: Pattern): Record<string, unknown> | null {
    return this.buildSingleFieldExpr(pattern, "$key.brand.code");
  }

  /**
   * Construye la expresión de búsqueda sin un prefijo de clave.
   *
   * Este método maneja diferentes tipos de patrones (`value`, `regex`, `comparison`, `range`) y construye
   * las expresiones correspondientes usando operadores de MongoDB.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda.
   * @param {boolean} isItemFull - Indica si la expresión se aplica a `items` con campos completos.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda, o `null` si no se pudo construir.
   *
   * @example
   * const expr = builder.buildExprWithoutPrefix(pattern, true);
   */
  private buildExprWithoutPrefix(
    pattern: Pattern,
    isItemFull: boolean,
  ): Record<string, unknown> | null {
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

  /**
   * Construye la expresión de prefijo de clave.
   *
   * Utiliza una expresión regular para verificar si el prefijo coincide con la concatenación de `line.code` y `brand.code`.
   *
   * @param {string} prefixValue - Valor del prefijo de clave.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de prefijo de clave, o `null` si no se pudo construir.
   *
   * @example
   * const prefixExpr = builder.buildPrefixExpr("GRAPVH");
   */
  private buildPrefixExpr(prefixValue: string): Record<string, unknown> | null {
    try {
      return {
        $expr: {
          $regexMatch: {
            input: {
              $concat: ["$key.line.code", "$key.brand.code"],
            },
            regex: prefixValue,
            options: "i",
          },
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Construye la expresión principal de búsqueda para el campo `code`.
   *
   * Dependiendo del tipo de patrón (`value`, `regex`, `comparison`, `range`), construye la expresión correspondiente.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda para `code`.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión principal de búsqueda, o `null` si no se pudo construir.
   *
   * @example
   * const mainExpr = builder.buildMainExpr(pattern);
   */
  private buildMainExpr(pattern: Pattern): Record<string, unknown> | null {
    switch (pattern.type) {
      case PatternType.VALUE:
        return {
          $expr: {
            $eq: ["$code", pattern.value],
          },
        };

      case PatternType.REGEX:
        return {
          $expr: {
            $regexMatch: {
              input: "$code",
              regex: pattern.value,
              options: "i",
            },
          },
        };

      case PatternType.COMPARISON:
        return {
          $expr: {
            [this.mapOperator(pattern.operator)]: ["$code", pattern.value],
          },
        };

      case PatternType.RANGE:
        return {
          $expr: {
            $and: [
              { $gte: ["$code", pattern.start] },
              { $lte: ["$code", pattern.end] },
            ],
          },
        };

      default:
        return null;
    }
  }

  /**
   * Construye la expresión de búsqueda para un campo único específico.
   *
   * Utiliza la ruta del campo (`fieldPath`) para construir la expresión basada en el tipo de patrón.
   *
   * @param {Pattern} pattern - Patrón que define la condición de búsqueda.
   * @param {string} fieldPath - Ruta del campo en el documento de MongoDB.
   * @returns {Record<string, unknown> | null} Objeto que representa la expresión de búsqueda para el campo, o `null` si no se pudo construir.
   *
   * @example
   * const lineExpr = builder.buildSingleFieldExpr(pattern, "$key.line.code");
   */
  private buildSingleFieldExpr(
    pattern: Pattern,
    fieldPath: string,
  ): Record<string, unknown> | null {
    switch (pattern.type) {
      case PatternType.VALUE:
        return {
          $expr: {
            $eq: [fieldPath, pattern.value],
          },
        };
      case PatternType.REGEX:
        return {
          $expr: {
            $regexMatch: {
              input: fieldPath,
              regex: pattern.value,
              options: "i",
            },
          },
        };
      case PatternType.COMPARISON:
        return {
          $expr: {
            [this.mapOperator(pattern.operator)]: [fieldPath, pattern.value],
          },
        };
      case PatternType.RANGE:
        return {
          $expr: {
            $and: [
              { $gte: [fieldPath, pattern.start] },
              { $lte: [fieldPath, pattern.end] },
            ],
          },
        };
      default:
        return null;
    }
  }

  /**
   * Mapea un operador de comparación a su equivalente en MongoDB.
   *
   * @param {ComparisonOperator} op - Operador de comparación definido en `ComparisonOperator`.
   * @returns {string} Operador de comparación equivalente en MongoDB.
   *
   * @example
   * const mongoOp = builder.mapOperator(ComparisonOperator.GT);
   * console.log(mongoOp); // "$gt"
   */
  private mapOperator(op: ComparisonOperator): string {
    switch (op) {
      case ComparisonOperator.GT:
        return "$gt";
      case ComparisonOperator.LT:
        return "$lt";
      case ComparisonOperator.GTE:
        return "$gte";
      case ComparisonOperator.LTE:
        return "$lte";
      default:
        return "$eq";
    }
  }
}
