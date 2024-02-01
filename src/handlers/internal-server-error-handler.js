const { HTTP_STATUS_CODES } = require("../app.constants");
const {
  getMiddlewareErrorHandlerMessage,
} = require("../app/shared/loggerHelper");

module.exports = {
  serverErrorHandler(err, req, res, next) {
    const message = getMiddlewareErrorHandlerMessage(
      err,
      "Error received in internal server error handler",
    );

    req.log.error({ message, level: "ERROR", requestId: req.id });

    if (res.headersSent) {
      return next(err);
    }

    if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return res.render("errors/session-ended.njk");
    }
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace
    res.err?.status
      ? res.status(res.err.status)
      : res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);

    req.session.currentPage = "pyi-technical";
    res.render("ipv/pyi-technical.njk", { context: "unrecoverable" });
  },
};
