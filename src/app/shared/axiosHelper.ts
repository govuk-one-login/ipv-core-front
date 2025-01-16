import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import https from "https";

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

const extractCredentialIssuerId = (
  response: AxiosResponse,
): string | undefined => {
  try {
    if (typeof response.config.data === "string") {
      return JSON.parse(response.config.data).credentialIssuerId;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    // Ignore
  }
  return undefined;
};

const buildRequestLog = (
  response: AxiosResponse,
  description: string,
): RequestLog => ({
  description,
  endpoint: `${response.request?.method} ${response.request?.path}`,
  cri: extractCredentialIssuerId(response),
  duration: response.config.startTime && Date.now() - response.config.startTime,
});

const axiosRequestTimer = async (
  requestConfig: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  requestConfig.startTime = Date.now();
  return requestConfig;
};

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

export const axiosErrorLogger = async (error: unknown): Promise<void> => {
  if (axios.isAxiosError(error) && error.config?.logger) {
    const logger = error.config.logger;
    if (error.response) {
      logger.error({
        message: {
          ...buildRequestLog(error.response, "API request failed"),
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

export const createAxiosInstance = (baseUrl: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseUrl,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  instance.interceptors.request.use(axiosRequestTimer);
  instance.interceptors.response.use(axiosResponseLogger, axiosErrorLogger);

  return instance;
};
