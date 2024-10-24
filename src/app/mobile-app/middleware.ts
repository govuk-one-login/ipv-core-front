import { MobileAppCallbackRequest } from "../../services/coreBackService";
import { handleBackendResponse } from "../ipv/middleware";
import { transformError } from "../shared/loggerHelper";
import * as CoreBackService from "../../services/coreBackService";
import { RequestHandler } from "express";

export const checkMobileAppDetails: RequestHandler = async (req, res, next) => {
  if (!req.query?.state) {
    throw new Error("Missing state query param");
  }

  const body: MobileAppCallbackRequest = {
    state: req.query?.state as string,
  };

  try {
    const apiResponse = await CoreBackService.postMobileAppCallback(req, body);
    if (apiResponse?.status) {
      res.status(apiResponse.status);
    }

    return handleBackendResponse(req, res, apiResponse?.data);
  } catch (error) {
    transformError(error, "error calling mobile app callback lambda");
    next(error);
  }
};
