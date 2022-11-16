const { HTTP_STATUS_CODES } = require("../app.constants");

module.exports = {
  serverErrorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return res.render("errors/session-ended.njk");
    }

    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace
    res.render("ipv/pyi-technical-unrecoverable.njk");
  },
};
