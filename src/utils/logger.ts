import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.LOG_LEVEL === "debug"
    ? { target: "pino/file", options: { destination: 1 } }
    : undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});
