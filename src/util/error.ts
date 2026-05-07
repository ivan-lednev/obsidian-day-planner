export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getErrorDescription(error: unknown) {
  if (error instanceof Error) {
    return error.stack;
  }

  if (typeof error === "object") {
    return JSON.stringify(error);
  }

  return String(error);
}
