const axios = require("axios");
const {
  API_BASE_URL,
  API_REQUEST_CONFIG_PATH,
  API_ISSUED_CREDENTIALS_PATH,
} = require("../../lib/config");
const logger = require("hmpo-logger").get();

module.exports = {
  setCriConfig: async (req, res, next) => {
    if (!req.session.criConfig) {
      try {
        logger.info("calling cri config lambda", { req, res });
        const apiResponse = await axios.get(
          `${API_BASE_URL}${API_REQUEST_CONFIG_PATH}`
        );
        req.session.criConfig = apiResponse.data;
      } catch (error) {
        logger.error("error calling cri config lambda", { req, res, error });
        res.error = error.name;
        return next(error);
      }
    }
    next();
  },

  getIssuedCredentials: async (req, res, next) => {
    try {
      logger.info("calling issued credentials lambda", { req, res });
      const apiResponse = await axios.get(
        `${API_BASE_URL}${API_ISSUED_CREDENTIALS_PATH}`,
        {
          headers: {
            "ipv-session-id": req.session.ipvSessionId,
          },
        }
      );

      const parsedResponse = {};
      for (const credential in apiResponse.data) {
        parsedResponse[credential] = JSON.parse(apiResponse.data[credential]);
      }

      req.issuedCredentials = parsedResponse;
    } catch (error) {
      logger.error("error fetching issued credentials", { req, res, error });
      res.error = error.name;
      return next(error);
    }
    next();
  },

  renderDebugPage: async (req, res) => {
    res.render("debug/page-ipv-debug", {
      criConfig: req.session.criConfig,
      issuedCredentials: req.issuedCredentials,
    });
  },
};
