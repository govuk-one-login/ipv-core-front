import { createPersonalDataHeaders } from "@govuk-one-login/frontend-passthrough-headers";
import {
  NamePartClass,
  PostalAddressClass,
} from "@govuk-one-login/data-vocab/credentials.js";
import { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { Request } from "express";
import { Logger } from "pino";
import { createAxiosInstance } from "../app/shared/axiosHelper";
import config from "../config/config";
import { PostJourneyEventResponse } from "../app/validators/postJourneyEventResponse";

const axiosInstance = createAxiosInstance(config.API_BASE_URL);

// Extend axios definition with logger
declare module "axios" {
  interface AxiosRequestConfig {
    logger?: Logger;
  }
}

export interface InitialiseSessionRequest {
  responseType: string;
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string;
  request: string;
}

export interface CriCallbackRequest {
  authorizationCode?: string;
  credentialIssuerId: string;
  error?: string;
  errorDescription?: string;
  redirectUri: string;
  state?: string;
}

export interface ProvenUserIdentityDetails {
  name: string;
  dateOfBirth: string;
  nameParts: NamePartClass[];
  addresses: PostalAddressClass[];
}

export interface MobileAppCallbackRequest {
  state?: string;
}

const generateAxiosConfig = (url: string, req: Request): AxiosRequestConfig => {
  const personalDataHeaders = createPersonalDataHeaders(url, req);
  return {
    headers: {
      "content-type": "application/json",
      "x-request-id": req.id as string,
      "ip-address": personalDataHeaders["x-forwarded-for"] || "unknown", // Passing x-forwarded-for as ip-address because AWS appends its own incorrect IP address when using "x-forwarded-for"
      language: req.cookies.lng,
      "feature-set": req.session.featureSet,
      ...(req.session.ipvSessionId && {
        "ipv-session-id": req.session.ipvSessionId,
      }),
      ...(req.session.clientOauthSessionId && {
        "client-session-id": req.session.clientOauthSessionId,
      }),
      ...personalDataHeaders,
    },
    logger: req.log,
  };
};

export const postJourneyEvent = (
  req: Request,
  event: string,
  currentPage?: string,
): Promise<AxiosResponse<PostJourneyEventResponse>> => {
  const requestConfig = generateAxiosConfig(
    `${config.API_BASE_URL}${config.API_JOURNEY_EVENT}/${event}`,
    req,
  );

  if (currentPage) {
    requestConfig.params = { currentPage };
  }

  return axiosInstance.post(
    `${config.API_JOURNEY_EVENT}/${event}`,
    {},
    requestConfig,
  );
};

export const postSessionInitialise = (
  req: Request,
  body: InitialiseSessionRequest,
): Promise<AxiosResponse> => {
  return axiosInstance.post(
    config.API_SESSION_INITIALISE,
    body,
    generateAxiosConfig(
      `${config.API_BASE_URL}${config.API_SESSION_INITIALISE}`,
      req,
    ),
  );
};

export const postCriCallback = (
  req: Request,
  body: CriCallbackRequest,
): Promise<AxiosResponse<PostJourneyEventResponse>> => {
  return axiosInstance.post(
    config.API_CRI_CALLBACK,
    body,
    generateAxiosConfig(
      `${config.API_BASE_URL}${config.API_CRI_CALLBACK}`,
      req,
    ),
  );
};

export const postMobileAppCallback = (
  req: Request,
  body: MobileAppCallbackRequest,
): Promise<AxiosResponse> => {
  return axiosInstance.post(
    config.API_MOBILE_APP_CALLBACK,
    body,
    generateAxiosConfig(
      `${config.API_BASE_URL}${config.API_MOBILE_APP_CALLBACK}`,
      req,
    ),
  );
};

export const getProvenIdentityUserDetails = (
  req: Request,
): Promise<AxiosResponse<ProvenUserIdentityDetails>> => {
  // prettier-ignore
  return axiosInstance.get(
    config.API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
    generateAxiosConfig(
      `${config.API_BASE_URL}${config.API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
      req,
    ),
  );
};

export const getDcMawPoll = async (req: Request): Promise<boolean> => {
  try {
    // Added for the browser tests
    if (config.ENABLE_PREVIEW) {
      return true;
    }

    await axiosInstance.get(
      config.API_DCMAW_POLL,
      generateAxiosConfig(
        `${config.API_BASE_URL}${config.API_DCMAW_POLL}`,
        req,
      ),
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};
