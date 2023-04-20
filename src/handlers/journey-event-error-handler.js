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

    if (
      res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED &&
      res.err?.response?.data?.criOAuthSessionId &&
      res.err?.response?.data?.page
    ) {
      const pageId = sanitize(res.err.response.data.page);
      req.session.clientOauthSessionId =
        res.err.response.data.criOAuthSessionId;
      return res.render(`ipv/${pageId}.njk`);
    }

    if (res.err?.response?.data?.page) {
      const pageId = sanitize(res.err.response.data.page);
      req.session.currentPage = pageId;
      return res.redirect(`/ipv/page/${pageId}`);
    }

    next(err);
  },
};
