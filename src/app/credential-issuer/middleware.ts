import { handleBackendResponse } from "../ipv/middleware";
import config from "../../config/config";
import {
  CriCallbackRequest,
  postCriCallback,
} from "../../services/coreBackService";
import { RequestHandler } from "express";
import BadRequestError from "../../errors/bad-request-error";

interface CriCallbackQuery {
  code?: string;
  id?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export const sendParamsToAPI: RequestHandler = async (req, res) => {
  const callbackUrl = new URL(
    "credential-issuer/callback",
    config.EXTERNAL_WEBSITE_HOST,
  );

  const query = req.query as CriCallbackQuery;

  if (!query.id) {
    throw new BadRequestError("id parameter is required");
  }

  callbackUrl.searchParams.set("id", query.id);

  const body: CriCallbackRequest = {
    authorizationCode: query.code,
    credentialIssuerId: query.id,
    redirectUri: callbackUrl.href,
    state: query.state,
  };

  if (query.error) {
    body.error = query.error;
    if (query.error_description) {
      body.errorDescription = query.error_description;
    }
  }

  const apiResponse = await postCriCallback(req, body);
  return handleBackendResponse(req, res, apiResponse, query.id);
};

// Temporary - this will replace the above method once all CRI's have been migrated across to use the new endpoint
export const sendParamsToAPIV2: RequestHandler = async (req, res) => {
  const criId = req.params.criId;
  const callbackUrl = new URL(
    `credential-issuer/callback/${encodeURIComponent(criId)}`,
    config.EXTERNAL_WEBSITE_HOST,
  );

  const query = req.query as CriCallbackQuery;

  const body: CriCallbackRequest = {
    authorizationCode: query.code,
    credentialIssuerId: criId,
    redirectUri: callbackUrl.href,
    state: query.state,
  };

  if (query.error) {
    body.error = query.error;
    if (query.error_description) {
      body.errorDescription = query.error_description;
    }
  }

  const apiResponse = await postCriCallback(req, body);
  return handleBackendResponse(req, res, apiResponse, criId);
};
