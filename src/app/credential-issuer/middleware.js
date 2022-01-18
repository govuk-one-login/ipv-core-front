const axios = require("axios");
const {
  API_BASE_URL,
  API_REQUEST_EVIDENCE_PATH,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");

module.exports = {
  buildCredentialIssuerRedirectURL: async (req, res, next) => {
    const cri = req.session?.criConfig?.find(criConfig => criConfig.id === req.query.id);

    if (!cri) {
      res.status(500);
      return res.send("Could not find configured CRI");
    }

    req.redirectURL = new URL(cri.authorizeUrl);
    req.redirectURL.searchParams.append("response_type", "code");
    req.redirectURL.searchParams.append("client_id", cri.ipvClientId);
    req.redirectURL.searchParams.append("state", "test-state");
    req.redirectURL.searchParams.append("redirect_uri", `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${cri.id}`);

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
      ["credential_issuer_id", req.query.id],
      ["redirect_uri", `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback`],
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
