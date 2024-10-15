import config from "../../lib/config";
import { logCoreBackCall, transformError } from "../shared/loggerHelper";
import { LOG_COMMUNICATION_TYPE_REQUEST } from "../shared/loggerConstants";
import {
  InitialiseSessionRequest,
  postSessionInitialise,
} from "../../services/coreBackService";
import { checkForIpvAndOauthSessionId, processAction } from "../ipv/middleware";
import { RequestHandler } from "express";

export const setIpvSessionId: RequestHandler = async (req, res, next) => {
  try {
    const authParams = {
      responseType: req.query.response_type,
      clientId: req.query.client_id,
      redirectUri: req.query.redirect_uri,
      state: req.query.state,
      scope: req.query.scope,
      request: req.query.request,
    } as InitialiseSessionRequest;

    if (!authParams.request) {
      return next(new Error("Request JWT Missing"));
    }
    if (!authParams.clientId) {
      return next(new Error("Client ID Missing"));
    }

    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
      path: config.API_SESSION_INITIALISE,
    });

    const response = await postSessionInitialise(req, authParams);

    req.session.ipvSessionId = response?.data?.ipvSessionId;
  } catch (error) {
    transformError(error, `error handling journey page: ${req.params}`);
    return next(error);
  }

  return next();
};

export const handleOAuthJourneyAction: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    checkForIpvAndOauthSessionId(req, res);
    await processAction(req, res, "next");
  } catch (error) {
    transformError(error, "error invoking handleOAuthJourneyAction");
    return next(error);
  }
};
