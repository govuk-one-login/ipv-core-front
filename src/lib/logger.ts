import { Request, RequestHandler, Response } from "express";
import pino, { Logger } from "pino";
import pinoHttp from "pino-http";
import { HANDLED_ERROR } from "../handlers/internal-server-error-handler";

const sensitiveParams = ["request", "code"];

export const redactQueryParams = (
  url: string | undefined,
): string | undefined => {
  if (url && url.includes("?")) {
    try {
      const parsedUrl = new URL(url);
      for (const param of sensitiveParams) {
        if (parsedUrl.searchParams.has(param)) {
          parsedUrl.searchParams.set(param, "hidden");
        }
      }
      return parsedUrl.href;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // ignore
    }
  }
  return url;
};

export const logger: Logger = pino({
  name: "di-ipv-core-front",
  level: process.env.LOGS_LEVEL || "debug",
  messageKey: "message", // rename default msg property to message,
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },
  serializers: {
    req: (req: Request) => {
      return {
        method: req.method,
        url: redactQueryParams(req.url),
      };
    },
    res: (res: Response) => {
      return {
        statusCode: res.statusCode,
        sessionId: res.locals.sessionId,
        location: redactQueryParams(
          res.getHeader("location") as string | undefined,
        ),
      };
    },
  },
});

const addRequestContext = (
  req: Request,
  res: Response,
  val: object,
): object => ({
  ...val,
  requestId: req.id,
  ipvSessionId: req.session?.ipvSessionId,
  sessionId: req.session?.id,
  context: req.session?.context ?? undefined,
});

export const loggerMiddleware: RequestHandler = pinoHttp({
  // Reuse an existing logger instance
  logger,
  // Define a custom request id function, this will be assigned to req.id
  genReqId: (req, res) => {
    const existingId = req.id ?? req.get("x-request-id");
    if (existingId) {
      return existingId;
    }

    // Not securely random, but this is just used for request correlation
    const newId = Math.random().toString(36).slice(2);
    res.header("x-request-id", newId);
    return newId;
  },
  // Set to `false` to prevent standard serializers from being wrapped.
  wrapSerializers: false,
  // Define a custom receive message
  customReceivedMessage: (req) => `REQUEST RECEIVED: ${req.method}`,
  customReceivedObject: addRequestContext,
  customErrorMessage: (req, res) =>
    `REQUEST FAILED WITH STATUS CODE: ${res.statusCode}`,
  customErrorObject: (req, res, error, val) => {
    // Ignore errors that have already been handled by the error handler
    if (val.err === HANDLED_ERROR) {
      delete val.err;
    }

    return addRequestContext(req, res, val);
  },
  customSuccessMessage: (req, res) =>
    `REQUEST ${res.statusCode >= 400 ? "FAILED" : "COMPLETED"} WITH STATUS CODE OF: ${res.statusCode}`,
  customSuccessObject: addRequestContext,
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
  // Define a custom logger level
  customLogLevel: (req, res, err) =>
    res.statusCode >= 400 || err ? "error" : "info",
});
