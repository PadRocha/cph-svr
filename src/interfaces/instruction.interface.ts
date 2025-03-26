import type { PipelineStage } from "mongoose";

type InstructionPatternData =
  | {
    patternType: "comparison";
    keyPrefix?: string;
    operator: ComparisonOperator;
    value: string;
  }
  | { patternType: "range"; keyPrefix?: string; start: string; end: string }
  | {
    patternType: "regex";
    keyPrefix?: string;
    value: string;
    extractedValue?: string;
  }
  | { patternType: "value"; keyPrefix?: string; value: string };

interface Instruction {
  token: string; // e.g. "items:[GRAPVH]>0050"
  field: string; // e.g. "items"
  type: "include" | "exclude";
  patternData: InstructionPatternData;
  matchStage: PipelineStage; // Almacena el $match que generamos
}

enum PatternType {
  VALUE = "value",
  REGEX = "regex",
  COMPARISON = "comparison",
  RANGE = "range",
}

enum ComparisonOperator {
  GT = ">",
  LT = "<",
  GTE = ">=",
  LTE = "<=",
}

// Patrones de tu parser
interface ValuePattern {
  type: PatternType.VALUE;
  value: string;
  keyPrefix?: string;
}

interface RegexPattern {
  type: PatternType.REGEX;
  value: string;
  keyPrefix?: string;
}

interface ComparisonPattern {
  type: PatternType.COMPARISON;
  operator: ComparisonOperator;
  value: string;
  keyPrefix?: string;
}

interface RangePattern {
  type: PatternType.RANGE;
  start: string;
  end: string;
  keyPrefix?: string;
}

type Pattern = ValuePattern | RegexPattern | ComparisonPattern | RangePattern;
type PatternField = "keys" | "items" | "lines" | "brands";

interface ParsedFieldSet {
  include: Pattern[];
  exclude: Pattern[];
}

interface ParsedResult {
  keys: ParsedFieldSet;
  items: ParsedFieldSet;
  lines: ParsedFieldSet;
  brands: ParsedFieldSet;
  desc?: string;
}

interface ResultPipeline {
  parseResult: ParsedResult;
  pipeline: PipelineStage[];
}

export { ComparisonOperator, PatternType };
export type {
  Instruction,
  InstructionPatternData,
  ParsedResult,
  Pattern,
  PatternField,
  ResultPipeline,
};
