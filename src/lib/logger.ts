import { RequestHandler } from "express";
import pino, { Logger } from "pino";
import pinoHttp from "pino-http";

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
    req: (req) => {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res: (res) => {
      return {
        statusCode: res.err?.response?.status || res?.statusCode,
        sessionId: res.locals.sessionId,
      };
    },
  },
});

export const loggerMiddleware: RequestHandler = pinoHttp({
  // Reuse an existing logger instance
  logger,
  // Define a custom request id function, this will be assigned to req.id
  genReqId: function (req, res) {
    if (req.id) return req.id;
    let id = req.get("x-request-id");
    if (id) return id;
    // Not securely random, but this is just used for request correlation
    id = Math.random().toString(36).slice(2);
    res.header("x-request-id", id);
    return id;
  },
  // Set to `false` to prevent standard serializers from being wrapped.
  wrapSerializers: false,
  // Define a custom receive message
  customReceivedMessage: function (req) {
    return "REQUEST RECEIVED: " + req.method;
  },
  customReceivedObject: function (req, res, val) {
    const commonParams = {
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.session?.id,
    };

    if (req.method === "GET") {
      return {
        ...val,
        ...commonParams,
        context: req.session?.context,
      };
    }
    return {
      ...val,
      ...commonParams,
    };
  },
  customErrorMessage: function (req, res) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.statusCode = (res?.err as any)?.response?.status || res?.statusCode;
    return `REQUEST ERRORED WITH STATUS CODE: ${res.statusCode}`;
  },
  customErrorObject: (req, res, error, val) => {
    const customErrorObject = {
      ...val,
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.session?.id,
      context: req.session?.context,
    };

    // Remove err.config for readability and to avoid exposing sensitive information
    if (customErrorObject?.err?.config) {
      delete customErrorObject.err.config;
    }

    return customErrorObject;
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return "RESOURCE NOT FOUND";
    }
    return `REQUEST COMPLETED WITH STATUS CODE OF: ${res.statusCode}`;
  },
  customSuccessObject: function (req, res, val) {
    const commonParams = {
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.session?.id,
    };
    if (req.method === "GET") {
      const successObject = {
        ...val,
        ...commonParams,
      };

      if (res.statusCode !== 302) {
        successObject.context = req.session?.context;
      }

      return successObject;
    }

    return {
      ...val,
      ...commonParams,
    };
  },
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
  // Define a custom logger level
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 || err) {
      return "error";
    }
    return "info";
  },
});
