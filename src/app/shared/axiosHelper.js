const axios = require("axios");
const https = require("https");
const { API_BASE_URL } = require("../../lib/config");
const { getCriFromErrorResponse } = require("./loggerHelper");

const createAxiosInstance = (onRejected) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  instance.interceptors.response.use(null, onRejected);

  return instance;
};

const axiosErrorHandler = (error) => {
  const logger = error.config.logger;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const cri = getCriFromErrorResponse(
        error.response
      );

      const message = {
        description: "Error response received in coreBackService",
        errorMessage: error.response.data,
        endpoint: `${error.request?.method} ${error.request?.path}`,
        cri,
        error: error.response
      }

      logger.error({ message, level: "ERROR" });
    } else if (error.request) {
      const message = {
        request: error.request,
        error: error,
        description: "Error occured making request in coreBackService",
      };

      logger.error({ message, level: "ERROR" });
    } else {
      const message = {
        error,
        description:
          "Something went wrong setting up the request in CoreBackService",
      };

      logger.error({ message, level: "ERROR" });
    }
  }

  return Promise.reject(error);
};

module.exports = {
  createAxiosInstance,
  axiosErrorHandler,
  generateAxiosConfig: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencodedinvalid",
        "ipv-session-id": req.session?.ipvSessionId + "invalid",
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
  generateAxiosConfigWithClientSessionId: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session?.ipvSessionId,
        "client-session-id": req?.session?.clientOauthSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
  generateJsonAxiosConfig: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": req.session?.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
};
