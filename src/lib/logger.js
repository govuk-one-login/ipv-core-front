const pino = require("pino");
const loggerMiddleware = require("pino-http")({
  // Reuse an existing logger instance
  logger: pino(),

  // Define custom serializers
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Set to `false` to prevent standard serializers from being wrapped.
  wrapSerializers: true,

  // Define a custom logger level
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },

  // Define a custom success message
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `${req.method} completed`;
  },

  // Define a custom receive message
  customReceivedMessage: function (req) {
    return "request received: " + req.method;
  },

  // Define a custom error message
  customErrorMessage: function (req, res) {
    return "request errored with status code: " + res.statusCode;
  },

  // Override attribute keys for the log object
  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
    responseTime: "timeTaken",
  },

  // Define additional custom request properties
  customProps: function (req, res) {
    return {
      customProp: req.customProp,
      // user request-scoped data is in res.locals for express applications
      customProp2: res.locals.myCustomData,
    };
  },
});

module.exports = {
  loggerMiddleware,
};
