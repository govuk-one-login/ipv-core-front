module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    const cri = req.cri ? req.cri : req.session?.criConfig?.find(criConfig => criConfig.id === req.query.id);

    if (!cri) {
      res.status(500);
      return res.send("Could not find configured CRI");
    }

    req.redirectURL = new URL(cri.authorizeUrl);
    req.redirectURL.searchParams.append("client_id", cri.ipvClientId);
    req.redirectURL.searchParams.append("request", cri.request);

    if(next) {
      next();
    }
  },
  redirectToAuthorize: async (req, res) => {
    res.redirect(req.redirectURL);
  }
}
