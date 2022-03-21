const axios = require("axios");
const {
  API_BASE_URL,
  API_REQUEST_EVIDENCE_PATH,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");

function generateAxiosConfig(req) {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ipv-session-id": req.session.ipvSessionId
      }
    };
}

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


    try {
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_REQUEST_EVIDENCE_PATH}`,
        evidenceParam,
        generateAxiosConfig(req)
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
  tryHandleRedirectError : async (req, res, next)  => {
    try {
      const {error, error_description} = req.query;
      if(error || error_description) {
        const errorParams = new URLSearchParams([
          ["error", error],
          ["error_description", error_description],
        ]);

        await axios.post(`${API_BASE_URL}/event/cri/error`, errorParams, generateAxiosConfig(req))
        return res.render("errors/credential-issuer", {error, error_description})
      }
    } catch (error) {
      next(error)
    }
    next()
  },
 };
