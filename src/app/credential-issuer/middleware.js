const {
  CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH,
} = require("../../lib/config");

module.exports = {
  redirectToAuthorize: async (req, res) => {
    if (!CREDENTIAL_ISSUER_BASE_URL) {
      return res.send(500);
    }

    const redirectURL = `${CREDENTIAL_ISSUER_BASE_URL}${CREDENTIAL_ISSUER_AUTH_PATH}`;
    res.redirect(redirectURL);
  },

  addCallbackParamsToSession: async (req, res, next) => {
    const callbackParams = {
      response_type: req.query.response_type,
      client_id: req.query.client_id,
      state: req.query.state,
      authorization_code: req.query.authorization_code,
      // need to confirm these are the correct params
    };

    req.session.callbackParams = callbackParams;

    next();
  },
  renderDebugPage: async (req, res) => {
    res.render("index");
  },
};
