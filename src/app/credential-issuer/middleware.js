const axios = require("axios");
const {
  API_BASE_URL,
  API_REQUEST_EVIDENCE_PATH,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");

module.exports = {
  addCallbackParamsToRequest: async (req, res, next) => {
    req.credentialIssuer = {};

    req.credentialIssuer.code = req.query?.code;

    next();
  },

  sendParamsToAPI: async (req, res, next) => {
    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.credentialIssuer.code],
      ["credential_issuer_id", req.query.id],
      ["redirect_uri", `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query.id}`],
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

      res.redirect("/journey/next")
    } catch (error) {
      if (error?.response?.status === 404) {
        res.status = error.response.status;
      } else {
        res.error = error.name;
      }
      next(error);
    }
  },
};
