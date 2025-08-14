import { MobileAppCallbackRequest } from "../../services/coreBackService";
import { processAction } from "../ipv/middleware";
import * as CoreBackService from "../../services/coreBackService";
import { RequestHandler } from "express";
import ipvPages from "../../constants/ipv-pages";

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

  // postMobileAppCallback will give us a journey event to carry on with. So here we call processAction() as if the user had selected a radio button action on the PYI_TRIAGE_MOBILE_DOWNLOAD_APP page.
  return await processAction(
    req,
    res,
    apiResponse.data.journey,
    ipvPages.PYI_TRIAGE_MOBILE_DOWNLOAD_APP,
  );
};
