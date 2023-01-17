const { HTTP_STATUS_CODES } = require("../app.constants");
const { logError } = require("../app/shared/loggerHelper");

module.exports = {
  serverErrorHandler(err, req, res, next) {
    const message = {
      err: err,
      description: "Error recieved in server error handler",
    };
    req.log.error({ message, level: "ERROR", requestId: req.id });

    if (res.headersSent) {
      const message = {
        description: "res.headers sent is true",
      };
      req.log.info({ message, level: "INFO", requestId: req.id });

      return next(err);
    }

    if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return res.render("errors/session-ended.njk");
    }
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

    try {
      res.err?.status
        ? res.status(res.err.status)
        : res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    } catch (e) {
      logError(req, e, "Bad response - status is not a function");
    }

    req.session.currentPage = "pyi-technical-unrecoverable";
    res.redirect("/ipv/page/pyi-technical-unrecoverable");
  },
};
