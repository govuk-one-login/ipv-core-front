module.exports = {
  journeyEventErrorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

    if (res.err?.response?.data?.page) {
      res.status(res.err.response.data.statusCode);
      return res.render(`ipv/${res.err.response.data.page}.njk`);
    }

    next(err);
  },
};
