const axios = require("axios");
const {
  API_BASE_URL,
  API_CRI_CALLBACK,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");
const { generateAxiosConfig } = require("../shared/axiosHelper");
const { handleBackendResponse } = require("../ipv/middleware");
const { transformError } = require("../shared/loggerHelper");
const logger = require("hmpo-logger").get();

module.exports = {
  sendParamsToAPI: async (req, res, next) => {
    const oauthParams = {
      authorizationCode: req.query?.code,
      credentialIssuerId: req.query.id,
      redirectUri: `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query.id}`,
      state: req.query?.state,
    };

    if (req.query?.error) {
      evidenceParam.append("error", req.query.error);
      if (req.query.error_description) {
        evidenceParam.append("error_description", req.query.error_description);
      }
    }

    try {
      logger.info("calling validate-callback lambda", { req, res });
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        evidenceParam,
        generateAxiosConfig(req.session.ipvSessionId)
      );
      res.status = apiResponse?.status;

      return handleBackendResponse(req, res, apiResponse.data);
    } catch (error) {
      transformError(error, "error calling validate-callback lambda");
      next(error);
    }
  },
  // Temporary - this will replace the above method once all CRI's have been migrated across to use the new endpoint
  sendParamsToAPIV2: async (req, res, next) => {
    const criId = req.params.criId;
    const redirectUri = `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback/${req.params.criId}`;

    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.query?.code],
      ["credential_issuer_id", criId],
      ["redirect_uri", redirectUri],
      ["state", req.query?.state],
    ]);

    if (req.query?.error) {
      evidenceParam.append("error", req.query.error);
      if (req.query.error_description) {
        evidenceParam.append("error_description", req.query.error_description);
      }
    }

    try {
      logger.info("calling validate-callback lambda", { req, res });
      const apiResponse = await axios.post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        evidenceParam,
        generateAxiosConfig(req.session.ipvSessionId)
      );
      res.status = apiResponse?.status;

      return handleBackendResponse(req, res, apiResponse.data);
    } catch (error) {
      transformError(error, "error calling validate-callback lambda");
      next(error);
    }
  },
};
