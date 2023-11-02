const { logError } = require("./loggerHelper");

module.exports = {
  saveSessionAndRedirect: async (req, res, redirectUrl) => {
    await req.session.save(function (err) {
      if (err) {
        logError(req, err, "Error saving session");
        throw err;
      }
      return res.redirect(redirectUrl);
    });
  },
};
