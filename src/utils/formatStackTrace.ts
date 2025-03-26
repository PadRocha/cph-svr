interface CallSite {
  getThis(): unknown;
  getTypeName(): string | null;
  getFunction(): Function | undefined;
  getFunctionName(): string | null;
  getMethodName(): string | null;
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
  getEvalOrigin(): string | undefined;
  isToplevel(): boolean;
  isEval(): boolean;
  isNative(): boolean;
  isConstructor(): boolean;
  isAsync(): boolean;
  isPromiseAll(): boolean;
  getPromiseIndex(): number | undefined;
}

interface ErrorConstructor extends Error {
  prepareStackTrace?: (err: Error, stackTraces: CallSite[]) => string;
}

export function formatStackTrace(error: ErrorConstructor): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = (err: Error, stackTraces: CallSite[]): string => {
    return stackTraces
      .map((callSite) => {
        const fileName = callSite.getFileName() || "unknown";
        const lineNumber = callSite.getLineNumber() || 0;
        const functionName = callSite.getFunctionName() || "<anonymous>";
        return `    at ${functionName} (${fileName}:${lineNumber})`;
      })
      .join("\n");
  };

  const stack = error.stack || "";
  Error.prepareStackTrace = originalPrepareStackTrace;
  return stack;
}
