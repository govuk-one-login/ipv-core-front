const pino = require("pino");
const { randomUUID } = require("node:crypto");
const logger = pino({
  name: "di-ipv-core",
  level: process.env.LOGS_LEVEL || "debug",
  serializers: {
    req: (req) => {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res: (res) => {
      return {
        status: res.statusCode,
        sessionId: res.locals.sessionId,
        clientSessionId: res.locals.clientSessionId,
        persistentSessionId: res.locals.persistentSessionId,
        languageFromCookie: res.locals.language?.toUpperCase(),
      };
    },
  },
});

const loggerMiddleware = require("pino-http")({
  // Reuse an existing logger instance
  logger,

  // Define a custom request id function
  genReqId: function (req, res) {
    if (req.requestId) return req.requestId;
    let id = req.get("x-request-id");
    if (id) return id;
    id = randomUUID();
    res.header("x-request-id", id);
    return id;
  },

  // Set to `false` to prevent standard serializers from being wrapped.
  wrapSerializers: true,
  quietReqLogger: true,
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
  customErrorMessage: function (error, res) {
    return "request errored with status code: " + res.statusCode;
  },
  customSuccessMessage: function (res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `request completed with status code of:${res.statusCode}`;
  },
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
});

function handle(req, res, next) {
  logger.child({
    requestId: req.requestId,
  });

  loggerMiddleware(req, res);
  next();
}

module.exports = {
  loggerMiddleware: handle,
  logger,
};
