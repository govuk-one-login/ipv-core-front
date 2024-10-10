const { API_CRI_CALLBACK, EXTERNAL_WEBSITE_HOST } =
  require("../../lib/config").default;
const { handleBackendResponse } = require("../ipv/middleware");
const { logCoreBackCall, transformError } = require("../shared/loggerHelper");
const { LOG_COMMUNICATION_TYPE_REQUEST } = require("../shared/loggerConstants");
const coreBackService = require("../../services/coreBackService");

module.exports = {
  sendParamsToAPI: async (req, res, next) => {
    const callbackUrl = new URL(
      "credential-issuer/callback",
      EXTERNAL_WEBSITE_HOST,
    );
    callbackUrl.searchParams.set("id", req.query?.id);

    const body = {
      authorizationCode: req.query?.code,
      credentialIssuerId: req.query?.id,
      redirectUri: callbackUrl.href,
      state: req.query?.state,
    };

    if (req.query?.error) {
      body.error = req.query.error;
      if (req.query.error_description) {
        body.errorDescription = req.query.error_description;
      }
    }

    try {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await coreBackService.postCriCallback(req, body);
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
    const callbackUrl = new URL(
      `credential-issuer/callback/${encodeURIComponent(criId)}`,
      EXTERNAL_WEBSITE_HOST,
    );

    const body = {
      authorizationCode: req.query?.code,
      credentialIssuerId: criId,
      redirectUri: callbackUrl.href,
      state: req.query?.state,
    };

    if (req.query?.error) {
      body.error = req.query.error;
      if (req.query.error_description) {
        body.errorDescription = req.query.error_description;
      }
    }

    try {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_CRI_CALLBACK,
      });

      const apiResponse = await coreBackService.postCriCallback(req, body);
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
