const { HTTP_STATUS_CODES } = require("../app.constants");
const axios = require("axios");
const PAGES = require("../constants/ipv-pages");
const {
  getIpvPageTemplatePath,
  getErrorPageTemplatePath,
} = require("../lib/paths");
const ERROR_PAGES = require("../constants/error-pages");

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
      return res.render(getErrorPageTemplatePath(ERROR_PAGES.SESSION_ENDED));
    }
    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace
    res.err?.status
      ? res.status(res.err.status)
      : res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);

    req.session.currentPage = PAGES.PYI_TECHNICAL;
    res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
      context: "unrecoverable",
    });
  },
};
