const { HTTP_STATUS_CODES } = require("../app.constants");

module.exports = {
  pageNotFoundHandler: (req, res, next) => {
    if (res.headersSent) {
      return next();
    }

    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render("errors/page-not-found.njk");
  },
};
