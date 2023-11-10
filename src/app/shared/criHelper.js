module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    const cri = req.cri
      ? req.cri
      : req.session?.criConfig?.find(
          (criConfig) => criConfig.id === req.query.id
        );

    if (!cri) {
      res.status(500);
      return res.send("Could not find configured CRI");
    }
    req.redirectURL = new URL(cri.redirectUrl);

    if (next) {
      next();
    }
  },
  redirectToAuthorize: async (req, res) => {
    res.redirect(req.redirectURL);
  },
};
