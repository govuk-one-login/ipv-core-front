const {
  CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH,
  PORT,
} = require("../../lib/config");

module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    if (!CREDENTIAL_ISSUER_BASE_URL) {
      return res.send(500);
    }

    // querystring.stringify(obj[, sep[, eq[, options]]])
    const credentialReturn = `http://localhost:${PORT}/credential-issuer/callback`;
    const credentialParams = `response_type=code&client_id=test&redirect_uri=${credentialReturn}`;
    req.redirectURL = `${CREDENTIAL_ISSUER_BASE_URL}${CREDENTIAL_ISSUER_AUTH_PATH}?${credentialParams}`;

    next();
  },
  redirectToAuthorize: async (req, res) => {
    res.redirect(req.redirectURL);
  },

  addCallbackParamsToRequest: async (req, res, next) => {
    req.credentialIssuer = {};

    req.credentialIssuer.code = req.query?.code;

    next();
  },

  sendParamsToAPI: (req, res, next) => {
    next();
  },

  redirectToDebugPage: async (req, res) => {
    res.redirect("/debug/");
  },
};
