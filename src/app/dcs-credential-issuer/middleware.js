const axios = require("axios");
const url = require("url");
const {
  DCS_CREDENTIAL_ISSUER_BASE_URL,
  DCS_CREDENTIAL_ISSUER_AUTH_PATH,
  API_BASE_URL,
  DCS_CREDENTIAL_ISSUER_ID,
  API_REQUEST_EVIDENCE_PATH,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");

module.exports = {
  buildDcsPassportCredentialIssuerRedirectURL: async (req, res, next) => {
    if (!DCS_CREDENTIAL_ISSUER_BASE_URL) return res.send(500);

    req.redirectURL = url.format({
      host: DCS_CREDENTIAL_ISSUER_BASE_URL,
      pathname: DCS_CREDENTIAL_ISSUER_AUTH_PATH,
      query: {
        response_type: "code",
        client_id: "test",
        state: "test-state",
        redirect_uri: `${EXTERNAL_WEBSITE_HOST}/dcs-credential-issuer/callback`,
      },
    });

    next();
  },
  redirectToAuthorize: async (req, res) => {
    res.redirect(req.redirectURL);
  },

  addCallbackParamsToRequest: async (req, res, next) => {
    req.dcsCredentialIssuer = {};

    req.dcsCredentialIssuer.code = req.query?.code;

    next();
  },

  sendParamsToAPI: async (req, res, next) => {
    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.dcsCredentialIssuer.code],
      ["credential_issuer_id", DCS_CREDENTIAL_ISSUER_ID],
      ["redirect_uri", `${EXTERNAL_WEBSITE_HOST}/dcs-credential-issuer/callback`],
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
