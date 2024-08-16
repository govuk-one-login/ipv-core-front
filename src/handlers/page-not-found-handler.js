const { HTTP_STATUS_CODES } = require("../app.constants");
const { getErrorPageTemplatePath } = require("../lib/paths");
const ERROR_PAGES = require("../constants/error-pages");

module.exports = {
  pageNotFoundHandler: (req, res, next) => {
    if (res.headersSent) {
      return next();
    }

    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render(getErrorPageTemplatePath(ERROR_PAGES.PAGE_NOT_FOUND));
  },
};
