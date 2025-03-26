import type { Instruction } from "@interfaces/instruction.interface.ts";
import { model, Schema } from 'mongoose';

const instructionSchema = new Schema<Instruction>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  field: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["include", "exclude"],
    required: true,
  },
  patternData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  matchStage: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const InstructionModel = model<Instruction>("Instruction", instructionSchema);

export { InstructionModel };
