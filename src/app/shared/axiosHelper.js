const axios = require("axios");
const https = require("https");
const { getCriFromErrorResponse } = require("./loggerHelper");

const createAxiosInstance = (baseUrl) => {
  const instance = axios.create({
    baseURL: baseUrl,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  instance.interceptors.response.use(null, axiosErrorHandler);

  return instance;
};

const axiosErrorHandler = (error) => {
  const logger = error.config.logger;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const cri = getCriFromErrorResponse(error.response);

      const message = {
        description: "Error response received from API",
        errorMessage: error.message,
        endpoint: `${error.request?.method} ${error.request?.path}`,
        data: error.response.data,
      };

      if (cri) {
        message.cri = cri;
      }

      logger.error({ message, level: "ERROR" });
    } else if (error.request) {
      const message = {
        error: error,
        description: "Error occurred making request to API",
      };

      logger.error({ message, level: "ERROR" });
    } else {
      const message = {
        error,
        description: "Something went wrong setting up an API request",
      };

      logger.error({ message, level: "ERROR" });
    }
  }

  return Promise.reject(error);
};

module.exports = {
  createAxiosInstance,
  axiosErrorHandler,
};
