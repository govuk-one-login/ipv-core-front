const {
  API_BASE_URL,
  API_CRI_CALLBACK,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");
const { generateJsonAxiosConfig } = require("../shared/axiosHelper");
const { handleBackendResponse } = require("../ipv/middleware");
const { logCoreBackCall, transformError } = require("../shared/loggerHelper");
const { LOG_COMMUNICATION_TYPE_REQUEST } = require("../shared/loggerConstants");
const http = require("http");
const https = require("https");
const axios = require("axios");

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
});

module.exports = {
  sendParamsToAPI: async (req, res, next) => {
    const body = {
      authorizationCode: req.query?.code,
      credentialIssuerId: req.query?.id,
      redirectUri: `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query?.id}`,
      state: req.query?.state,
    };

    const errorDetails = {};
    if (req.query?.error) {
      errorDetails.error = req.query.error;
      if (req.query.error_description) {
        errorDetails.errorDescription = req.query.error_description;
      }
    }

    try {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await axiosInstance.post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        { ...body, ...errorDetails },
        generateJsonAxiosConfig(req),
      );
      if (apiResponse?.status) {
        res.status(apiResponse.status);
      }

      return handleBackendResponse(req, res, apiResponse?.data);
    } catch (error) {
      error.csrfToken = req.csrfToken();
      transformError(error, "error calling validate-callback lambda");
      next(error);
    }
  },
  // Temporary - this will replace the above method once all CRI's have been migrated across to use the new endpoint
  sendParamsToAPIV2: async (req, res, next) => {
    const criId = req.params.criId;

    const body = {
      authorizationCode: req.query?.code,
      credentialIssuerId: criId,
      redirectUri: `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback/${criId}`,
      state: req.query?.state,
    };

    const errorDetails = {};
    if (req.query?.error) {
      errorDetails.error = req.query.error;
      if (req.query.error_description) {
        errorDetails.errorDescription = req.query.error_description;
      }
    }

    try {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await axiosInstance.post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        { ...body, ...errorDetails },
        generateJsonAxiosConfig(req),
      );
      if (apiResponse?.status) {
        res.status(apiResponse.status);
      }

      return handleBackendResponse(req, res, apiResponse.data);
    } catch (error) {
      transformError(error, "error calling validate-callback lambda");
      next(error);
    }
  },
};
