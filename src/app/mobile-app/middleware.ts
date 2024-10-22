import { MobileAppCallbackRequest } from "../../services/coreBackService";
import config from "../../lib/config";
import { handleBackendResponse } from "../ipv/middleware";
import { logCoreBackCall, transformError } from "../shared/loggerHelper";
import { LOG_COMMUNICATION_TYPE_REQUEST } from "../shared/loggerConstants";
import * as CoreBackService from "../../services/coreBackService";

module.exports = {
  checkMobileAppDetails: async (req, res, next) => {
    const body: MobileAppCallbackRequest = {
      state: req.query?.state,
    };

    try {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: config.API_MOBILE_APP_CALLBACK,
      });

      const apiResponse = await CoreBackService.postMobileAppCallback(
        req,
        body,
      );
      if (apiResponse?.status) {
        res.status(apiResponse.status);
      }

      return handleBackendResponse(req, res, apiResponse?.data);
    } catch (error) {
      error.csrfToken = req.csrfToken();
      transformError(error, "error calling mobile app callback lambda");
      next(error);
    }
  },
};
