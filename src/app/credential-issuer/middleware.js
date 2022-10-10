const axios = require("axios");
const {
  API_BASE_URL,
  API_CRI_VALIDATE_CALLBACK,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");
const { generateAxiosConfig } = require("../shared/axiosHelper");
const { handleJourneyResponse } = require("../ipv/middleware");
const logger = require("hmpo-logger").get();

module.exports = {
  addCallbackParamsToRequest: async (req, _res, next) => {
    req.credentialIssuer = {};

    req.credentialIssuer.code = req.query?.code;
    req.credentialIssuer.state = req.query?.state;

    next();
  },
  sendParamsToAPI: async (req, res, next) => {
    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.credentialIssuer.code],
      ["credential_issuer_id", req.query.id],
      [
        "redirect_uri",
        `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query.id}`,
      ],
      ["state", req.credentialIssuer.state],
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
        `${API_BASE_URL}${API_CRI_VALIDATE_CALLBACK}`,
        evidenceParam,
        generateAxiosConfig(req.session.ipvSessionId)
      );
      res.status = apiResponse?.status;

      return handleJourneyResponse(req, res, apiResponse.data?.journey);
    } catch (error) {
      logger.error("error calling validate-callback lambda", {
        req,
        res,
        error,
      });
      if (error?.response?.status === 404) {
        res.status = error.response.status;
      } else {
        res.error = error.name;
      }
      next(error);
    }
  },
  // Temporary - this will replace the above method once all CRI's have been migrated across to use the new endpoint
  sendParamsToAPIV2: async (req, res, next) => {
    const criId = req.params.criId;
    const redirectUri = `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback/${req.params.criId}`;

    const evidenceParam = new URLSearchParams([
      ["authorization_code", req.credentialIssuer.code],
      ["credential_issuer_id", criId],
      ["redirect_uri", redirectUri],
      ["state", req.credentialIssuer.state],
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
        `${API_BASE_URL}${API_CRI_VALIDATE_CALLBACK}`,
        evidenceParam,
        generateAxiosConfig(req.session.ipvSessionId)
      );
      res.status = apiResponse?.status;

      return handleJourneyResponse(req, res, apiResponse.data?.journey);
    } catch (error) {
      logger.error("error calling validate-callback lambda", {
        req,
        res,
        error,
      });
      if (error?.response?.status === 404) {
        res.status = error.response.status;
      } else {
        res.error = error.name;
      }
      next(error);
    }
  },
};
