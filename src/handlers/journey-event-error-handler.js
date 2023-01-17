const sanitize = require("sanitize-filename");

module.exports = {
  journeyEventErrorHandler(err, req, res, next) {
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

    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

    if (res.err?.response?.data?.page) {
      res.status(res.err.response.data.statusCode);
      req.session.currentPage = res.err.response.data.page;
      return res.redirect(`/ipv/page/${sanitize(res.err.response.data.page)}`);
    }

    next(err);
  },
};
