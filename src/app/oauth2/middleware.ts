import {
  InitialiseSessionRequest,
  postSessionInitialise,
} from "../../services/coreBackService";
import { processAction } from "../ipv/middleware";
import { RequestHandler } from "express";
import BadRequestError from "../../errors/bad-request-error";
import TechnicalError from "../../errors/technical-error";

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
      throw new BadRequestError("request parameter is required");
    }
    if (!authParams.clientId) {
      throw new BadRequestError("clientId parameter is required");
    }

    const response = await postSessionInitialise(req, authParams);

    req.session.ipvSessionId = response?.data?.ipvSessionId;
  } catch (error) {
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
    if (!req.session.ipvSessionId) {
      throw new TechnicalError("missing ipvSessionId");
    }
    await processAction(req, res, "next");
  } catch (error) {
    return next(error);
  }
};
