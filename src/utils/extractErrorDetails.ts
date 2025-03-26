interface StackFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

interface ErrorDetails {
  message: string;
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  stack?: StackFrame[];
}

function parseStackTrace(stack?: string): StackFrame[] {
  if (!stack) return [];

  const stackFrames: StackFrame[] = [];
  const stackLines = stack.split("\n");
  const stackRegex = /\s*at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/;

  for (const line of stackLines) {
    const match = line.match(stackRegex);
    if (match) {
      const [, functionName, fileName, lineNumber, columnNumber] = match;
      stackFrames.push({
        functionName: functionName || "<anonymous>",
        fileName,
        lineNumber: parseInt(lineNumber, 10),
        columnNumber: parseInt(columnNumber, 10),
      });
    }
  }

  return stackFrames.reverse();
}

export function extractErrorDetails(error: Error): ErrorDetails {
  const details: ErrorDetails = {
    message: error.message,
    stack: parseStackTrace(error.stack),
  };

  // Verificar si el error es una instancia de MongoServerError
  if ("code" in error && "keyPattern" in error && "keyValue" in error) {
    details.code = (error as any).code;
    details.keyPattern = (error as any).keyPattern;
    details.keyValue = (error as any).keyValue;
  }

  return details;
}
