const axios = require("axios");
const { API_BASE_URL } = require("../../lib/config");
const { transformError } = require("../shared/loggerHelper");
const logger = require("hmpo-logger").get();

module.exports = {
  setDebugJourneyType: (req, _res, next) => {
    req.session.isDebugJourney = true;
    next();
  },

  setRealJourneyType: (req, res, next) => {
    logger.info("starting real journey", { req, res });
    req.session.isDebugJourney = false;
    next();
  },

  setIpvSessionId: async (req, res, next) => {
    try {
      const authParams = {
        responseType: req.query.response_type,
        clientId: req.query.client_id,
        redirectUri: req.query.redirect_uri,
        state: req.query.state,
        scope: req.query.scope,
        isDebugJourney: req.session.isDebugJourney,
        request: req.query.request,
      };

      if (!authParams.request) {
        return next(new Error("Request JWT Missing"));
      }
      if (!authParams.clientId) {
        return next(new Error("Client ID Missing"));
      }

      logger.info("calling initialise-ipv-session lambda", { req, res });
      const response = await axios.post(
        `${API_BASE_URL}/session/initialise`,
        authParams
      );
      req.session.ipvSessionId = response?.data?.ipvSessionId;
    } catch (error) {
      transformError(error, "error calling initialise-ipv-session lambda");
      return next(error);
    }

    next();
  },
};
