const {
  API_BASE_URL,
  API_REQUEST_CONFIG_PATH,
  API_BUILD_DEBUG_CREDENTIAL_DATA_PATH,
} = require("../../lib/config");
const { transformError } = require("../shared/loggerHelper");
const { getAxios } = require("../shared/axiosHelper");

module.exports = {
  setCriConfig: async (req, res, next) => {
    if (!req.session.criConfig) {
      try {
        req.log.info("calling cri config lambda", { req, res });
        const apiResponse = await getAxios(req).get(
          `${API_BASE_URL}${API_REQUEST_CONFIG_PATH}`
        );
        req.session.criConfig = apiResponse.data;
      } catch (error) {
        transformError(error, "error calling cri config lambda");
        return next(error);
      }
    }
    next();
  },

  getIssuedCredentials: async (req, res, next) => {
    try {
      req.log.info("calling build-debug-credential-data lambda");
      const apiResponse = await getAxios(req).get(
        `${API_BASE_URL}${API_BUILD_DEBUG_CREDENTIAL_DATA_PATH}`,
        {
          headers: {
            "ipv-session-id": req.session.ipvSessionId,
            "ip-address": req.session.ipAddress,
          },
        }
      );

      const parsedResponse = {};
      for (const credential in apiResponse.data) {
        parsedResponse[credential] = JSON.parse(apiResponse.data[credential]);
      }

      req.issuedCredentials = parsedResponse;
    } catch (error) {
      transformError(error, "error fetching debug credential data");
      return next(error);
    }
    next();
  },

  renderDebugPage: async (req, res) => {
    res.render("debug/page-ipv-debug.njk", {
      criConfig: req.session.criConfig,
      issuedCredentials: req.issuedCredentials,
    });
  },
};
