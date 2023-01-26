const {
  API_BASE_URL,
  API_CRI_CALLBACK,
  EXTERNAL_WEBSITE_HOST,
} = require("../../lib/config");
const { generateJsonAxiosConfig, getAxios } = require("../shared/axiosHelper");
const { handleBackendResponse } = require("../ipv/middleware");
const {
  logCoreBackCall,
  transformError,
  logError,
} = require("../shared/loggerHelper");
const { LOG_COMMUNICATION_TYPE_REQUEST } = require("../shared/loggerConstants");
const { HTTP_STATUS_CODES } = require("../../app.constants");

module.exports = {
  sendParamsToAPI: async (req, res, next) => {
    const body = {
      authorizationCode: req.query?.code,
      credentialIssuerId: req.query.id,
      redirectUri: `${EXTERNAL_WEBSITE_HOST}/credential-issuer/callback?id=${req.query.id}`,
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
      if (!req.session?.ipvSessionId) {
        const err = new Error("cri req.ipvSessionId is missing");
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical-unrecoverable";
        return res.redirect(`/ipv/page/pyi-technical-unrecoverable`);
      }

      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await getAxios(req).post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        { ...body, ...errorDetails },
        generateJsonAxiosConfig(req)
      );
      res.status = apiResponse?.status;

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
      if (!req.session?.ipvSessionId) {
        const err = new Error("cri req.ipvSessionId is missing");
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical-unrecoverable";
        return res.redirect(`/ipv/page/pyi-technical-unrecoverable`);
      }

      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await getAxios(req).post(
        `${API_BASE_URL}${API_CRI_CALLBACK}`,
        { ...body, ...errorDetails },
        generateJsonAxiosConfig(req)
      );
      res.status = apiResponse?.status;

      return handleBackendResponse(req, res, apiResponse.data);
    } catch (error) {
      transformError(error, "error calling validate-callback lambda");
      next(error);
    }
  },
};
