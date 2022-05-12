const axios = require("axios");
const {
  API_BASE_URL,
  API_CRI_RETURN_PATH,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");
const { generateAxiosConfig } = require("../shared/axiosHelper");



module.exports = {
  addCallbackParamsToRequest: async (req, res, next) => {
    req.credentialIssuer = {};

    req.credentialIssuer.code = req.query?.code;
    req.credentialIssuer.state = req.query?.state;

    next();
  },

  sendParamsToAPI: async (req, res, next) => {
    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.credentialIssuer.code],
      ["credential_issuer_id", req.query.id],
      ["redirect_uri", `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query.id}`],
      ["state", req.credentialIssuer.state],
    ]);


    try {
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_CRI_RETURN_PATH}`,
        evidenceParam,
        generateAxiosConfig(req.session.ipvSessionId)
      );
      res.status = apiResponse?.status;

      res.redirect(`/ipv${apiResponse.data?.journey}`);
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

        await axios.post(`${API_BASE_URL}/journey/cri/error`, errorParams, generateAxiosConfig(req.session.ipvSessionId))
        return res.render("errors/credential-issuer", {error, error_description})
      }
    } catch (error) {
      next(error)
    }
    next()
  },
 };
