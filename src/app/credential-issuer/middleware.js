const {
  CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH,
  PORT,
} = require("../../lib/config");
const url = require('url');
module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    if (!CREDENTIAL_ISSUER_BASE_URL) {
      return res.send(500);
    }
    req.redirectURL = url.format({
      host: CREDENTIAL_ISSUER_BASE_URL,
      pathname: CREDENTIAL_ISSUER_AUTH_PATH,
      query: {
        response_type: "code",
        client_id: "test",
        redirect_uri: url.format({
          protocol: "http",
          hostname: "localhost",
          port: PORT,
          pathname: "/credential-issuer/callback"
        })}
    });
    //const queryString = querystring.stringify
    // querystring.stringify(obj[, sep[, eq[, options]]])

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
