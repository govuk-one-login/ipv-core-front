const { HTTP_STATUS_CODES } = require("../app.constants");
const path = require("path");
const { addNunjucksExt } = require("../lib/paths");

module.exports = {
  pageNotFoundHandler: (req, res, next) => {
    if (res.headersSent) {
      return next();
    }

    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render(path.join("errors", addNunjucksExt("page-not-found")));
  },
};
