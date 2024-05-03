const { HTTP_STATUS_CODES } = require("../app.constants");
const { getTemplatePath } = require("../lib/paths");

module.exports = {
  pageNotFoundHandler: (req, res, next) => {
    if (res.headersSent) {
      return next();
    }

    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render(getTemplatePath("errors", "page-not-found"));
  },
};
