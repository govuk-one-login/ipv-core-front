const pino = require("pino");
const { randomUUID } = require("node:crypto");
const logger = pino({
  name: "di-ipv-core",
  level: process.env.LOGS_LEVEL || "debug",
  messageKey: "message", // rename default msg property to message
  serializers: {
    req: (req) => {
      return {
        requestId: req.id,
        method: req.method,
        url: req.url,
        ipvSessionId: req.session?.ipvSessionId,
        sessionId: req.sessionId,
      };
    },
    res: (res) => {
      return {
        status: res.statusCode,
        sessionId: res.locals.sessionId,
      };
    },
  },
});

const loggerMiddleware = require("pino-http")({
  // Reuse an existing logger instance
  logger,

  // Define a custom request id function
  genReqId: function (req, res) {
    if (req.id) return req.id;
    let id = req.get("x-request-id");
    if (id) return id;
    id = randomUUID();
    res.header("x-request-id", id);
    return id;
  },

  // Set to `false` to prevent standard serializers from being wrapped.
  wrapSerializers: false,
  autoLogging: {
    ignorePaths: [
      "/public/scripts/cookies.js",
      "/public/scripts/all.js",
      "/public/style.css",
      "/public/scripts",
      "/public/scripts/application.js",
      "/assets/images/govuk-crest-2x.png",
      "/assets/fonts/bold-b542beb274-v2.woff2",
      "/assets/fonts/bold-b542beb274-v2.woff2",
      "/assets/images/favicon.ico",
      "/assets/fonts/light-94a07e06a1-v2.woff2",
    ],
  },
  // Define a custom receive message
  customReceivedMessage: function (req) {
    return "request received: " + req.method;
  },
  customReceivedObject: function (req, res, val) {
    return {
      ...val,
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.sessionId,
    };
  },
  customErrorMessage: function (error, req, res) {
    return "request errored with status code: " + res.statusCode;
  },
  customErrorObject: (req, res, error, val) => {
    return {
      ...val,
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.sessionId,
    };
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `request completed with status code of:${res.statusCode}`;
  },
  customSuccessObject: function (req, res, val) {
    return {
      ...val,
      requestId: req.id,
      ipvSessionId: req.session?.ipvSessionId,
      sessionId: req.sessionId,
    };
  },
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
});

module.exports = {
  loggerMiddleware,
  logger,
};
