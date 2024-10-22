const { logError } = require("./loggerHelper");

module.exports = {
  saveSessionAndRedirect: (req, res, redirectUrl) => {
    req.session.save(function (err) {
      if (err) {
        logError(req, err, "Error saving session");
        throw err;
      }
      return res.redirect(redirectUrl);
    });
  },
};
