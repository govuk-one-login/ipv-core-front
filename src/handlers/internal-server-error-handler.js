const { HTTP_STATUS_CODES } = require("../app.constants");
const axios = require("axios");

module.exports = {
  serverErrorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    if (!axios.isAxiosError(err)) {
      req.log.error({
        message: { err, message: "An internal server error occured" },
        level: "ERROR",
      });
    }

    if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return res.render("errors/session-ended.njk");
    }
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace
    res.err?.status
      ? res.status(res.err.status)
      : res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);

    req.session.currentPage = "pyi-technical";
    res.render("ipv/page/pyi-technical.njk", { context: "unrecoverable" });
  },
};
