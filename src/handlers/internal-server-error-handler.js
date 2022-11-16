const { HTTP_STATUS_CODES } = require("../app.constants");
const { logError } = require("../app/shared/loggerHelper");

module.exports = {
  serverErrorHandler(err, req, res, next) {
    // if (req.log) {
    //   req.log.info({
    //     message: {
    //       label: "internal-server-error-handler - extra error details",
    //       error: err,
    //       req,
    //       res,
    //     },
    //   });
    // }

    if (res.headersSent) {
      return next(err);
    }

    if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return res.render("errors/session-ended.njk");
    }
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

    try {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    } catch (e) {
      logError(req, e, "Bad response - status is not a function");
    }

    res.render("ipv/pyi-technical-unrecoverable.njk");
  },
};
