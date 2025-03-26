/**
 * @module utils
 * @description Este módulo proporciona la clase `InstructionParser` para analizar líneas de instrucciones
 * y convertirlas en objetos `ParsedResult` estructurados. Utiliza patrones definidos para identificar
 * diferentes tipos de datos y categorizar las inclusiones y exclusiones en campos específicos.
 *
 * ## Descripción General
 *
 * La clase `InstructionParser` está diseñada para interpretar una cadena de instrucciones que especifica
 * inclusiones y exclusiones de patrones en diferentes categorías como `keys`, `items`, `lines`, y `brands`.
 * Cada instrucción puede contener diferentes tipos de patrones, incluyendo valores literales, expresiones
 * regulares, operaciones de comparación y rangos de valores. La clase procesa estas instrucciones y
 * estructura los resultados en un objeto `ParsedResult` para facilitar su uso en otras partes de la aplicación.
 *
 * ## Expresiones Regulares Utilizadas
 *
 * Las expresiones regulares (`RegExp`) juegan un papel crucial en la identificación y clasificación de
 * los diferentes tipos de patrones dentro de las instrucciones. A continuación, se detallan las expresiones
 * regulares utilizadas en este módulo:
 *
 * - **`PatternType.VALUE` (`/^[A-Z0-9]{5,6}$/`):**
 *   - **Descripción:** Coincide con cadenas que contienen entre 5 y 6 caracteres alfanuméricos en mayúsculas.
 *   - **Ejemplos Válidos:** `"ABCDE"`, `"12345"`, `"A1B2C3"`
 *   - **Ejemplos Inválidos:** `"abcdE"`, `"1234"`, `"ABCDEFG"`
 *
 * - **`PatternType.ITEMS` (`/^([A-Z0-9]{6}|[A-Z0-9]{5}\s)[A-Z0-9]{4}$/`):**
 *   - **Descripción:** Coincide con cadenas que tienen 6 caracteres alfanuméricos o 5 caracteres seguidos de un espacio,
 *     seguidos de 4 caracteres alfanuméricos.
 *   - **Ejemplos Válidos:** `"ABCDEF1234"`, `"ABCDE 1234"`
 *   - **Ejemplos Inválidos:** `"ABCDE123"`, `"ABCD EF1234"`, `"ABCDEFG1234"`
 *
 * - **`PatternType.LINES` (`/^[A-Z0-9]{3}$/`):**
 *   - **Descripción:** Coincide con cadenas que contienen exactamente 3 caracteres alfanuméricos en mayúsculas.
 *   - **Ejemplos Válidos:** `"ABC"`, `"123"`, `"A1B"`
 *   - **Ejemplos Inválidos:** `"AB"`, `"ABCD"`, `"abc"`
 *
 * - **`PatternType.BRANDS` (`/^[A-Z0-9]{2,3}$/`):**
 *   - **Descripción:** Coincide con cadenas que contienen entre 2 y 3 caracteres alfanuméricos en mayúsculas.
 *   - **Ejemplos Válidos:** `"AB"`, `"ABC"`, `"A1"`
 *   - **Ejemplos Inválidos:** `"A"`, `"ABCD"`, `"ab"`
 *
 * - **Patrones de Comparación (`/^(>=|<=|>|<).+$/`):**
 *   - **Descripción:** Detecta operaciones de comparación que comienzan con `>`, `<`, `>=`, o `<=` seguidas de cualquier carácter.
 *   - **Ejemplos Válidos:** `">1000"`, `"<=2000"`, `"<500"`
 *   - **Ejemplos Inválidos:** `"1000>"`, `"==1000"`, `"<>1000"`
 *
 * - **Patrones de Rango (`/^.+<>.+$/`):**
 *   - **Descripción:** Detecta rangos de valores separados por `<>`.
 *   - **Ejemplos Válidos:** `"1000<>2000"`, `"A1B2<>C3D4"`
 *   - **Ejemplos Inválidos:** `"1000-2000"`, `"1000><2000"`, `"10002000"`
 *
 * - **Patrones de Expresiones Regulares (`/[*^$]/` o `^".+"$` o `^'.+'$/`):**
 *   - **Descripción:** Identifica expresiones regulares que contienen caracteres especiales como `*`, `^`, `$` o están
 *     encerradas entre comillas simples o dobles.
 *   - **Ejemplos Válidos:** `"^ABC.*"`, `"'\\d{4}'"`, `"A*B$"`
 *   - **Ejemplos Inválidos:** `"ABC"`, `"A-B-C"`, `"1234"`
 */

enum PatternType {
  /**
   * Representa un valor literal.
   */
  VALUE = "value",

  /**
   * Representa una expresión regular.
   */
  REGEX = "regex",

  /**
   * Representa una operación de comparación (>, <, >=, <=).
   */
  COMPARISON = "comparison",

  /**
   * Representa un rango de valores.
   */
  RANGE = "range",
}

enum ComparisonOperator {
  /**
   * Operador de comparación mayor que (>).
   */
  GT = ">",

  /**
   * Operador de comparación menor que (<).
   */
  LT = "<",

  /**
   * Operador de comparación mayor o igual que (>=).
   */
  GTE = ">=",

  /**
   * Operador de comparación menor o igual que (<=).
   */
  LTE = "<=",
}

interface ValuePattern {
  /**
   * Tipo de patrón, en este caso `value`.
   */
  type: PatternType.VALUE;

  /**
   * Valor literal del patrón.
   */
  value: string;

  /**
   * Prefijo de clave opcional para categorizar el patrón.
   */
  keyPrefix?: string;
}

interface RegexPattern {
  /**
   * Tipo de patrón, en este caso `regex`.
   */
  type: PatternType.REGEX;

  /**
   * Expresión regular del patrón.
   */
  value: string;

  /**
   * Prefijo de clave opcional para categorizar el patrón.
   */
  keyPrefix?: string;
}

interface ComparisonPattern {
  /**
   * Tipo de patrón, en este caso `comparison`.
   */
  type: PatternType.COMPARISON;

  /**
   * Operador de comparación utilizado en el patrón.
   */
  operator: ComparisonOperator;

  /**
   * Valor a comparar en el patrón.
   */
  value: string;

  /**
   * Prefijo de clave opcional para categorizar el patrón.
   */
  keyPrefix?: string;
}

interface RangePattern {
  /**
   * Tipo de patrón, en este caso `range`.
   */
  type: PatternType.RANGE;

  /**
   * Valor de inicio del rango.
   */
  start: string;

  /**
   * Valor de fin del rango.
   */
  end: string;

  /**
   * Prefijo de clave opcional para categorizar el patrón.
   */
  keyPrefix?: string;
}

type Pattern = ValuePattern | RegexPattern | ComparisonPattern | RangePattern;

interface ParsedResult {
  /**
   * Patrones incluidos y excluidos para las claves.
   */
  keys: {
    include: Pattern[];
    exclude: Pattern[];
  };

  /**
   * Patrones incluidos y excluidos para los ítems.
   */
  items: {
    include: Pattern[];
    exclude: Pattern[];
  };

  /**
   * Patrones incluidos y excluidos para las líneas.
   */
  lines: {
    include: Pattern[];
    exclude: Pattern[];
  };

  /**
   * Patrones incluidos y excluidos para las marcas.
   */
  brands: {
    include: Pattern[];
    exclude: Pattern[];
  };

  /**
   * Descripción adicional de la instrucción.
   */
  desc?: string;
}

/**
 * Define un tipo restringido para los campos que contienen `include` y `exclude`.
 */
type PatternField = "keys" | "items" | "lines" | "brands";

/**
 * Clase `InstructionParser` que analiza una línea de instrucción y produce un objeto `ParsedResult`.
 *
 * @example
 * ```typescript
 * const parser = new InstructionParser('keys:"ABCDE" -items:>1000 "additional description"');
 * console.log(parser.result);
 * // {
 * //   keys: { include: [{ type: 'value', value: 'ABCDE' }], exclude: [] },
 * //   items: { include: [], exclude: [{ type: 'comparison', operator: '>', value: '1000' }] },
 * //   lines: { include: [], exclude: [] },
 * //   brands: { include: [], exclude: [] },
 * //   desc: "additional description"
 * // }
 * ```
 */
class InstructionParser {
  /**
   * Resultado del análisis de la instrucción.
   */
  public result: ParsedResult;

  /**
   * Mapeo de alias de campos a los campos reales en `ParsedResult`.
   */
  private static fieldAliases: Record<string, keyof ParsedResult> = {
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

  /**
   * Definición de patrones para cada campo.
   */
  private static fieldPatterns: Record<keyof ParsedResult, RegExp> = {
    keys: /^[A-Z0-9]{5,6}$/,
    items: /^([A-Z0-9]{6}|[A-Z0-9]{5}\s)[A-Z0-9]{4}$/,
    lines: /^[A-Z0-9]{3}$/,
    brands: /^[A-Z0-9]{2,3}$/,
    desc: /^$/, // No aplica, se usa para descripciones
  };

  /**
   * Crea una instancia de `InstructionParser` y analiza la instrucción proporcionada.
   *
   * @param {string} instruction - Línea de instrucción a analizar.
   * @throws {Error} Si la instrucción proporcionada no es una cadena válida.
   */
  constructor(instruction?: string) {
    if (typeof instruction !== "string") {
      throw new Error("La instrucción debe ser una cadena de texto.");
    }

    this.result = {
      keys: { include: [], exclude: [] },
      items: { include: [], exclude: [] },
      lines: { include: [], exclude: [] },
      brands: { include: [], exclude: [] },
      desc: "",
    };

    if (instruction.trim() === "") {
      return; // Si la instrucción está vacía, no hacemos nada
    }

    this.parseInstruction(instruction);
  }

  /**
   * Método principal que coordina el análisis de la instrucción.
   *
   * Este método tokeniza la instrucción, procesa cada token para identificar patrones,
   * y asigna los patrones a las categorías correspondientes (incluidos o excluidos).
   *
   * @param {string} instruction - Línea de instrucción a analizar.
   */
  private parseInstruction(instruction: string): void {
    const tokens = this.tokenize(instruction);
    const processedIndices = new Set<number>();

    for (let i = 0; i < tokens.length; i++) {
      if (processedIndices.has(i)) continue;

      const token = tokens[i];
      let exclude = false;
      let field: keyof ParsedResult | undefined;
      let value = token;

      // Verificar si es una exclusión (prefijo '-')
      if (token.startsWith("-")) {
        exclude = true;
        value = value.substring(1);
      }

      // Verificar si el token tiene un prefijo de campo con valor entre comillas
      const fieldMatchQuoted = value.match(/^(\w+):["'](.+)["']$/);
      if (fieldMatchQuoted) {
        const alias = fieldMatchQuoted[1].toLowerCase();
        field = InstructionParser.fieldAliases[alias];
        value = fieldMatchQuoted[2];
      } else {
        // Verificar si el token tiene un prefijo de campo sin comillas
        const fieldMatch = value.match(/^(\w+):(.+)$/);
        if (fieldMatch) {
          const alias = fieldMatch[1].toLowerCase();
          field = InstructionParser.fieldAliases[alias];
          value = fieldMatch[2];
        }
      }

      // Inicializar patterns como un arreglo vacío
      let patterns: Pattern[] = [];

      // Intentar combinar con el siguiente token si aplica y si no tiene un campo específico
      if (!field && i + 1 < tokens.length) {
        const combinedValue = `${value} ${tokens[i + 1]}`;
        if (InstructionParser.fieldPatterns.items.test(combinedValue)) {
          value = combinedValue;
          processedIndices.add(i + 1);
          patterns = this.extractPatterns(value);
          this.assignPatterns(patterns, "items", exclude);
          continue;
        }
      }

      // Extraer patrones del valor actual
      patterns = this.extractPatterns(value);

      if (patterns.length > 0) {
        if (field) {
          // Asignar a la categoría especificada (incluido o excluido)
          this.assignPatterns(patterns, field as PatternField, exclude);
        } else {
          // Determinar la categoría basándose en el patrón y asignar
          const determinedField = this.determineField(value, patterns);
          if (determinedField) {
            this.assignPatterns(patterns, determinedField, exclude);
          } else {
            // Si no se puede determinar el campo, agregar a la descripción
            this.result.desc += token + " ";
          }
        }
      } else if (!field) {
        // Si el token no coincide con ningún patrón específico y no tiene campo, agregar a desc
        this.result.desc += token + " ";
      }
    }

    // Eliminar espacios finales en la descripción
    this.result.desc = this.result.desc!.trim();
  }

  /**
   * Tokeniza la instrucción respetando las comillas dobles y simples.
   *
   * Esta función divide la instrucción en tokens individuales, asegurándose de que los valores
   * que contienen espacios y están entre comillas se traten como un solo token.
   *
   * @param {string} instruction - Línea de instrucción a tokenizar.
   * @returns {string[]} Arreglo de tokens.
   *
   * @example
   * const tokens = parser.tokenize('key:"ABCDE" -items:>1000 "description with spaces"');
   * console.log(tokens); // ['key:"ABCDE"', '-items:>1000', '"description with spaces"']
   */
  private tokenize(instruction: string): string[] {
    // Si no contiene ningún prefijo (ej. "keys:", "item:", etc.),
    // devolvemos la instrucción tal cual, en un solo token
    if (!/(\w+):/i.test(instruction)) {
      return [instruction];
    }

    // Si sí hay un prefijo, entonces tokenizamos normalmente
    const regex = /\w+:"[^"]+"|\w+:'[^']+'|\S+/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(instruction)) !== null) {
      tokens.push(match[0]);
    }

    return tokens;
  }

  /**
   * Extrae patrones de un valor dado.
   *
   * Este método identifica el tipo de patrón presente en el valor y lo convierte en un objeto
   * correspondiente según la interfaz definida.
   *
   * @param {string} value - Valor del token.
   * @returns {Pattern[]} Arreglo de objetos `Pattern`.
   *
   * @example
   * const patterns = parser.extractPatterns('>1000');
   * console.log(patterns);
   * // [{ type: 'comparison', operator: '>', value: '1000' }]
   */
  private extractPatterns(value: string): Pattern[] {
    const patterns: Pattern[] = [];

    // Manejar patrones con keyPrefix, por ejemplo: [GRAPVH]>50 o [PVH$]>50
    const keyPrefixMatch = value.match(/^\[([^\]]+)\](.+)$/);
    let keyPrefix: string | undefined;
    let patternValue = value;

    if (keyPrefixMatch) {
      keyPrefix = keyPrefixMatch[1];
      patternValue = keyPrefixMatch[2];
    }

    // Determinar el tipo de patrón y extraer la información correspondiente
    if (this.isComparisonPattern(patternValue)) {
      const comparison = this.parseComparison(patternValue);
      if (comparison) {
        patterns.push({
          type: PatternType.COMPARISON,
          operator: comparison.operator,
          value: comparison.value,
          ...(keyPrefix ? { keyPrefix } : {}),
        });
      }
    } else if (this.isRangePattern(patternValue)) {
      const range = this.parseRange(patternValue);
      if (range) {
        patterns.push({
          type: PatternType.RANGE,
          start: range.start,
          end: range.end,
          ...(keyPrefix ? { keyPrefix } : {}),
        });
      }
    } else if (this.isRegexPattern(patternValue)) {
      const regex = this.parseRegex(patternValue);
      if (regex) {
        patterns.push({
          type: PatternType.REGEX,
          value: regex,
          ...(keyPrefix ? { keyPrefix } : {}),
        });
      }
    } else {
      // Valor simple
      patterns.push({
        type: PatternType.VALUE,
        value: patternValue.replace(/^"|"$/g, "").replace(/^'|'$/g, ""), // Eliminar comillas si las hay
        ...(keyPrefix ? { keyPrefix } : {}),
      });
    }

    return patterns;
  }

  /**
   * Determina a qué campo pertenece un valor basándose en los patrones definidos.
   *
   * Este método utiliza las expresiones regulares predefinidas para verificar a qué categoría
   * (`keys`, `items`, `lines`, `brands`) pertenece el valor proporcionado.
   *
   * @param {string} value - Valor del token.
   * @param {Pattern[]} patterns - Patrones extraídos del valor.
   * @returns {PatternField | undefined} Campo al que pertenece el valor o `undefined` si no se puede determinar.
   *
   * @example
   * const field = parser.determineField('>1000', [{ type: 'comparison', operator: '>', value: '1000' }]);
   * console.log(field); // 'items'
   */
  private determineField(
    value: string,
    patterns: Pattern[],
  ): PatternField | undefined {
    // Verificar si el valor coincide con alguna expresión regular definida para los campos
    for (
      const [field, regex] of Object.entries(
        InstructionParser.fieldPatterns,
      )
    ) {
      if (field === "desc") continue; // Excluir 'desc'
      const parsedField = field as keyof ParsedResult;
      if (regex.test(value)) {
        return parsedField as PatternField;
      }
    }

    // Verificar si el patrón corresponde a tipos específicos que se asignan por defecto a 'items'
    for (const pattern of patterns) {
      switch (pattern.type) {
        case PatternType.COMPARISON:
        case PatternType.RANGE:
        case PatternType.REGEX:
          // Asumimos que estos patrones pertenecen a 'items' por defecto
          return "items";
        case PatternType.VALUE:
          // Determinar basado en patrones de cada campo
          if (InstructionParser.fieldPatterns.items.test(value)) {
            return "items";
          }
          if (InstructionParser.fieldPatterns.keys.test(value)) {
            return "keys";
          }
          if (InstructionParser.fieldPatterns.lines.test(value)) {
            return "lines";
          }
          if (InstructionParser.fieldPatterns.brands.test(value)) {
            return "brands";
          }
          break;
        default:
          break;
      }
    }

    return undefined;
  }

  /**
   * Asigna patrones a una categoría específica.
   *
   * Este método añade los patrones al arreglo correspondiente dentro del objeto `ParsedResult`,
   * ya sea en la sección de inclusiones o exclusiones según el parámetro `exclude`.
   *
   * @param {Pattern[]} patterns - Arreglo de patrones a asignar.
   * @param {PatternField} field - Campo al que se asignan los patrones.
   * @param {boolean} exclude - Indica si los patrones son de exclusión (`true`) o inclusión (`false`).
   *
   * @example
   * parser.assignPatterns([{ type: 'value', value: 'ABCDE' }], 'keys', false);
   * console.log(parser.result.keys.include);
   * // [{ type: 'value', value: 'ABCDE' }]
   */
  private assignPatterns(
    patterns: Pattern[],
    field: PatternField,
    exclude: boolean,
  ): void {
    patterns.forEach((pattern) => {
      this.result[field][exclude ? "exclude" : "include"].push(pattern);
    });
  }

  /**
   * Verifica si el valor corresponde a un patrón de comparación.
   *
   * Este método utiliza una expresión regular para determinar si el valor comienza con
   * uno de los operadores de comparación (`>`, `<`, `>=`, `<=`) seguido de cualquier carácter.
   *
   * @param {string} value - Valor a verificar.
   * @returns {boolean} `true` si es un patrón de comparación, `false` en caso contrario.
   *
   * @example
   * const isComparison = parser.isComparisonPattern('>1000');
   * console.log(isComparison); // true
   */
  private isComparisonPattern(value: string): boolean {
    return /^(>=|<=|>|<).+/.test(value);
  }

  /**
   * Analiza un patrón de comparación y extrae el operador y el valor.
   *
   * Este método descompone el patrón de comparación en su operador (`>`, `<`, `>=`, `<=`)
   * y el valor numérico a comparar. Además, rellena el valor con ceros a la izquierda
   * para asegurar que tenga al menos 4 caracteres.
   *
   * @param {string} value - Valor del patrón de comparación.
   * @returns {{ operator: ComparisonOperator; value: string } | undefined} Objeto con operador y valor, o `undefined` si no coincide.
   *
   * @example
   * const comparison = parser.parseComparison('>1000');
   * console.log(comparison);
   * // { operator: '>', value: '1000' }
   */
  private parseComparison(
    value: string,
  ): { operator: ComparisonOperator; value: string } | undefined {
    const match = value.match(/^(>=|<=|>|<)(.+)$/);
    if (match) {
      const operatorMap: Record<string, ComparisonOperator> = {
        ">": ComparisonOperator.GT,
        "<": ComparisonOperator.LT,
        ">=": ComparisonOperator.GTE,
        "<=": ComparisonOperator.LTE,
      };
      const operator = operatorMap[match[1]];
      let rawValue = match[2];

      // Rellenar valores con ceros a la izquierda para que tengan al menos 4 caracteres
      if (rawValue.length < 4) {
        rawValue = rawValue.padStart(4, "0");
      }

      return { operator, value: rawValue };
    }
    return undefined;
  }

  /**
   * Verifica si el valor corresponde a un patrón de rango.
   *
   * Este método utiliza una expresión regular para determinar si el valor contiene
   * el delimitador `<>`, indicando un rango de valores.
   *
   * @param {string} value - Valor a verificar.
   * @returns {boolean} `true` si es un patrón de rango, `false` en caso contrario.
   *
   * @example
   * const isRange = parser.isRangePattern('1000<>2000');
   * console.log(isRange); // true
   */
  private isRangePattern(value: string): boolean {
    return /^.+<>.+$/.test(value);
  }

  /**
   * Analiza un patrón de rango y extrae el inicio y el fin.
   *
   * Este método descompone el patrón de rango en sus valores de inicio y fin.
   * Además, rellena ambos valores con ceros a la izquierda para asegurar que tengan al menos 4 caracteres.
   *
   * @param {string} value - Valor del patrón de rango.
   * @returns {{ start: string; end: string } | undefined} Objeto con inicio y fin, o `undefined` si no coincide.
   *
   * @example
   * const range = parser.parseRange('1000<>2000');
   * console.log(range);
   * // { start: '1000', end: '2000' }
   */
  private parseRange(
    value: string,
  ): { start: string; end: string } | undefined {
    const match = value.match(/^(.+)<>(.+)$/);
    if (match) {
      let start = match[1];
      let end = match[2];

      // Rellenar todos los valores con ceros a la izquierda para que tengan al menos 4 caracteres
      if (start.length < 4) {
        start = start.padStart(4, "0");
      }
      if (end.length < 4) {
        end = end.padStart(4, "0");
      }

      return { start, end };
    }
    return undefined;
  }

  /**
   * Verifica si el valor corresponde a un patrón de expresión regular.
   *
   * Este método determina si el valor contiene caracteres especiales utilizados en expresiones regulares
   * como `*`, `^`, `$` o si está completamente entrecomillado (simple o doble).
   *
   * @param {string} value - Valor a verificar.
   * @returns {boolean} `true` si es un patrón de expresión regular, `false` en caso contrario.
   *
   * @example
   * const isRegex = parser.isRegexPattern('^ABC.*');
   * console.log(isRegex); // true
   */
  private isRegexPattern(value: string): boolean {
    // Considera regex si contiene *, ^, $, o está entre comillas
    return /[*^$]/.test(value) || /^".+"$/.test(value) || /^'.+'$/.test(value);
  }

  /**
   * Analiza un patrón de expresión regular y extrae el valor.
   *
   * Este método elimina las comillas simples o dobles que rodean la expresión regular, si están presentes.
   *
   * @param {string} value - Valor del patrón de expresión regular.
   * @returns {string | undefined} Valor de la expresión regular, o `undefined` si no coincide.
   *
   * @example
   * const regex = parser.parseRegex('"^ABC.*"');
   * console.log(regex); // '^ABC.*'
   */
  private parseRegex(value: string): string | undefined {
    // Eliminar comillas si las hay
    return value.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  }
}

export { ComparisonOperator, InstructionParser, PatternType };

export type { ParsedResult, Pattern, PatternField };
