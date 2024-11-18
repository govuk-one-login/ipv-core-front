import { MobileAppCallbackRequest } from "../../services/coreBackService";
import { handleBackendResponse } from "../ipv/middleware";
import * as CoreBackService from "../../services/coreBackService";
import { RequestHandler } from "express";

export const checkMobileAppDetails: RequestHandler = async (req, res) => {
  if (!req.query?.state) {
    throw new Error("Missing state query param");
  }

  const body: MobileAppCallbackRequest = {
    state: req.query?.state as string,
  };

  const apiResponse = await CoreBackService.postMobileAppCallback(req, body);
  if (apiResponse?.status) {
    res.status(apiResponse.status);
  }

  // If we don't have a clientOAuthSessionId in our session then we're dealing with a cross browser callback and core back will give us a clientOAuthSessionId to use instead.
  if (
    !req.session.ipvSessionId &&
    !req.session.clientOauthSessionId &&
    apiResponse.data.clientOAuthSessionId
  ) {
    req.session.clientOauthSessionId = apiResponse.data.clientOAuthSessionId;
  }

  return handleBackendResponse(req, res, apiResponse?.data);
};
