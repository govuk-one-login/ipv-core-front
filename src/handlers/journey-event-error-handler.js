const sanitize = require("sanitize-filename");

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
      req.session.currentPage = pageId;
      return res.redirect(`/ipv/page/${pageId}`);
    }

    next(err);
  },
};
