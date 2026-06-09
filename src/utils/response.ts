import { Response } from "express";
import { ApiResponse, ApiError } from "../types/api.js";

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
): void {
  const body: ApiError = {
    success: false,
    error: { message, code, statusCode },
  };
  res.status(statusCode).json(body);
}
