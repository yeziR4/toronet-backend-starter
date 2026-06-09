import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { ToronetError } from "../types/errors.js";
import { sendError } from "../utils/response.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ToronetError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    sendError(res, err.statusCode, err.message, err.code);
    return;
  }

  logger.error({ err }, "Unhandled error");
  sendError(res, 500, "Internal server error");
}
