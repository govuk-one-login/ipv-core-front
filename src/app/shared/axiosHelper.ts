import API_URLS from "../../config/config";
import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import https from "https";
import { redactQueryParams } from "../../lib/logger";

// Extend axios definition with logger
declare module "axios" {
  interface AxiosRequestConfig {
    startTime?: number;
  }
}

interface RequestLog {
  description: string;
  endpoint: string;
  data?: object;
  cri?: string;
  duration?: number;
}

const ALLOWED_RESPONSE_DATA_LOGGING_ENDPOINTS: string[] = [
  API_URLS.API_CRI_CALLBACK,
  API_URLS.API_MOBILE_APP_CALLBACK,
  API_URLS.API_JOURNEY_EVENT,
  API_URLS.API_SESSION_INITIALISE,
];

// Helper function to determine if an endpoint is in the allow list
const isEndpointAllowedForDataLogging = (url: string): boolean => {
  return Object.values(ALLOWED_RESPONSE_DATA_LOGGING_ENDPOINTS).some(
    (allowedUrl) => url.includes(allowedUrl),
  );
};

// Extract credentialIssuerId for logging
const extractCredentialIssuerId = (
  response: AxiosResponse,
): string | undefined => {
  try {
    if (typeof response.config.data === "string") {
      return JSON.parse(response.config.data).credentialIssuerId;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    // Ignore parsing errors
  }
  return undefined;
};

// Sanitise response data based on endpoint allow list
export const sanitiseResponseData = (
  response: AxiosResponse,
): object | undefined => {
  // Only allow data logging for endpoints explicitly in the allow list
  const endpoint = response.config?.url ?? "";
  if (!isEndpointAllowedForDataLogging(endpoint)) {
    return undefined;
  }

  try {
    if (typeof response.data === "object") {
      const body = { ...response.data };

      // Sanitize redirect URLs for allowed endpoints
      if (body.cri?.redirectUrl) {
        body.cri = {
          ...body.cri,
          redirectUrl: redactQueryParams(body.cri.redirectUrl),
        };
      }
      if (body.client?.redirectUrl) {
        body.client = {
          ...body.client,
          redirectUrl: redactQueryParams(body.client.redirectUrl),
        };
      }
      return body;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    // Safely catch and ignore errors
  }
  return undefined;
};

// Build the request log
const buildRequestLog = (
  response: AxiosResponse,
  description: string,
): RequestLog => {
  const endpoint = `${response.request?.method} ${response.request?.path}`;
  return {
    description,
    endpoint,
    data: sanitiseResponseData(response),
    cri: extractCredentialIssuerId(response),
    duration:
      response.config.startTime && Date.now() - response.config.startTime,
  };
};

// Log the start time for requests
export const axiosRequestTimer = async (
  requestConfig: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  requestConfig.startTime = Date.now();
  return requestConfig;
};

// Log responses
export const axiosResponseLogger = async (
  response: AxiosResponse,
): Promise<AxiosResponse> => {
  const logger = response.config.logger;
  if (logger) {
    logger.info({
      message: buildRequestLog(response, "API request completed"),
    });
  }
  return response;
};

// Log errors
export const axiosErrorLogger = async (error: unknown): Promise<void> => {
  if (axios.isAxiosError(error) && error.config?.logger) {
    const logger = error.config.logger;
    if (error.response) {
      logger.warn({
        message: {
          ...buildRequestLog(error.response, "API returned error response"),
          errorMessage: error.message,
          errorStatus: error.response.status,
        },
      });
    } else if (error.request) {
      logger.error({
        message: {
          description: "Error occurred making request to API",
          endpoint: `${error.request.method} ${error.request.path}`,
          errorMessage: error.message,
        },
      });
    } else {
      logger.error({
        message: {
          description: "Something went wrong setting up an API request",
          errorMessage: error.message,
        },
      });
    }
  }
  return Promise.reject(error);
};

// Create an Axios instance with interceptors
export const createAxiosInstance = (baseUrl: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseUrl,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });
  instance.interceptors.request.use(axiosRequestTimer);
  instance.interceptors.response.use(axiosResponseLogger, axiosErrorLogger);
  return instance;
};
