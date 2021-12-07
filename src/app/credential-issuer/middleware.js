const axios = require("axios");
const url = require("url");
const {
  CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH,
  API_BASE_URL,
  CREDENTIAL_ISSUER_ID,
  API_REQUEST_EVIDENCE_PATH,
  BASE_URL,
} = require("../../lib/config");

module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    if (!CREDENTIAL_ISSUER_BASE_URL) return res.send(500);

    req.redirectURL = url.format({
      host: CREDENTIAL_ISSUER_BASE_URL,
      pathname: CREDENTIAL_ISSUER_AUTH_PATH,
      query: {
        response_type: "code",
        client_id: "test",
        state: "test-state",
        redirect_uri: `${BASE_URL}/credential-issuer/callback`,
      },
    });

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

  sendParamsToAPI: async (req, res, next) => {
    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.credentialIssuer.code],
      ["credential_issuer_id", CREDENTIAL_ISSUER_ID],
      ["redirect_uri", `${BASE_URL}/credential-issuer/callback`],
    ]);

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session.ipvSessionId,
      },
    };

    try {
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_REQUEST_EVIDENCE_PATH}`,
        evidenceParam,
        config
      );
      res.status = apiResponse?.status;
      next();
    } catch (error) {
      if (error?.response?.status == 404) {
        res.status = error.response.status;
      } else {
        res.error = error.name;
      }
      next(error);
    }
  },

  redirectToDebugPage: async (req, res) => {
    res.redirect("/debug/");
  },
};
