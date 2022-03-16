const { EXTERNAL_WEBSITE_HOST } = require("../../lib/config");

module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    const cri = req.cri ? req.cri : req.session?.criConfig?.find(criConfig => criConfig.id === req.query.id);

    if (!cri) {
      res.status(500);
      return res.send("Could not find configured CRI");
    }

    req.redirectURL = new URL(cri.authorizeUrl);
    req.redirectURL.searchParams.append("response_type", "code");
    req.redirectURL.searchParams.append("client_id", cri.ipvClientId);
    req.redirectURL.searchParams.append("state", "test-state");
    req.redirectURL.searchParams.append("redirect_uri", `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${cri.id}`);
    req.redirectURL.searchParams.append("request", req.session.sharedAttributesJwt);

    if(next) {
      next();
    }
  },
  redirectToAuthorize: async (req, res) => {
    res.redirect(req.redirectURL);
  }
}
