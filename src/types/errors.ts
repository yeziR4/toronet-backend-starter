export class ToronetError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "ToronetError";
  }
}

export class NotFoundError extends ToronetError {
  constructor(entity: string, identifier: string) {
    super(`${entity} not found: ${identifier}`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ToronetError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class SdkError extends ToronetError {
  constructor(operation: string, detail: string) {
    super(
      `SDK operation failed: ${operation} — ${detail}`,
      502,
      "SDK_ERROR",
    );
    this.name = "SdkError";
  }
}
