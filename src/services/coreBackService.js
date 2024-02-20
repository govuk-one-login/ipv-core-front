const {
  API_BASE_URL,
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
} = require("../lib/config");
const {
  getMiddlewareErrorHandlerMessage,
} = require("../app/shared/loggerHelper");
const {
  generateAxiosConfig,
  generateAxiosConfigWithClientSessionId,
  generateJsonAxiosConfig
} = require("../app/shared/axiosHelper")

const https = require("https");
const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  httpsAgent: new https.Agent({ keepAlive: true }),
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const logger = error.config.logger;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const message = getMiddlewareErrorHandlerMessage(
          error.response,
          "Error response received in coreBackService",
        );

        logger.error({ message, level: "ERROR" });
      } else if (error.request) {
        const message = {
          request: error.request,
          message: "Error occured making request in coreBackService",
        };

        logger.error({ message, level: "ERROR" });
      } else {
        const message = {
          error,
          message:
            "Something went wrong setting up the request in CoreBackService",
        };

        logger.error({ message, level: "ERROR" });
      }
    }

    return Promise.reject(error);
  },
);

function postAction(req, action) {
  return axiosInstance.post(
    `/${action}`,
    {},
    req.session?.clientOauthSessionId
      ? generateAxiosConfigWithClientSessionId(req)
      : generateAxiosConfig(req),
  );
}

function postSessionInitialise(req, authParams) {
  const logger = req.log;
  return axiosInstance.post(API_SESSION_INITIALISE, authParams, {
    headers: {
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
    logger,
  });
}

function postCriCallback(req, body, errorDetails) {
  return axiosInstance.post(
    API_CRI_CALLBACK,
    { ...body, ...errorDetails },
    generateJsonAxiosConfig(req),
  );
}

function getProvenIdentityUserDetails(req) {
  return axiosInstance.get(
    API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
    generateAxiosConfig(req),
  );
}

module.exports = {
  postAction,
  postSessionInitialise,
  postCriCallback,
  getProvenIdentityUserDetails,
};
