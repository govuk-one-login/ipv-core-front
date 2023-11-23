const sanitize = require("sanitize-filename");
const { HTTP_STATUS_CODES } = require("../app.constants");

module.exports = {
  journeyEventErrorHandler(err, req, res, next) {
    const message = {
      err: err,
      response: err?.response?.data,
      description: "Error received in journey event error handler",
    };
    req.log.error({ message, level: "ERROR", requestId: req.id });

    if (res.headersSent) {
      return next(err);
    }

    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

    if (res.err?.response?.data?.page) {
      const pageId = sanitize(res.err.response.data.page);

      if (res.err?.response?.data?.clientOAuthSessionId) {
        req.session.clientOauthSessionId =
          res.err.response.data.clientOAuthSessionId;
      }
      req.session.currentPage = pageId;
      res.err?.status
        ? res.status(res.err.status)
        : res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);

      return res.render(`ipv/${pageId}.njk`, {
        pageId: pageId,
        csrfToken: req.csrfToken(),
      });
    }

    next(err);
  },
};
