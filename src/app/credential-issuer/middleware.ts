import { handleBackendResponse } from "../ipv/middleware";
import { transformError } from "../shared/loggerHelper";
import config from "../../lib/config";
import {
  CriCallbackRequest,
  postCriCallback,
} from "../../services/coreBackService";
import { RequestHandler } from "express";

interface CriCallbackQuery {
  code?: string;
  id?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export const sendParamsToAPI: RequestHandler = async (req, res, next) => {
  const callbackUrl = new URL(
    "credential-issuer/callback",
    config.EXTERNAL_WEBSITE_HOST,
  );

  const query = req.query as CriCallbackQuery;

  if (!query.id) {
    throw new Error("Missing id query param");
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

  try {
    const apiResponse = await postCriCallback(req, body);

    if (apiResponse?.status) {
      res.status(apiResponse.status);
    }

    return handleBackendResponse(req, res, apiResponse?.data);
  } catch (error) {
    transformError(error, "error calling validate-callback lambda");
    next(error);
  }
};

// Temporary - this will replace the above method once all CRI's have been migrated across to use the new endpoint
export const sendParamsToAPIV2: RequestHandler = async (req, res, next) => {
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

  try {
    const apiResponse = await postCriCallback(req, body);

    if (apiResponse?.status) {
      res.status(apiResponse.status);
    }

    return handleBackendResponse(req, res, apiResponse.data);
  } catch (error) {
    transformError(error, "error calling validate-callback lambda");
    next(error);
  }
};
