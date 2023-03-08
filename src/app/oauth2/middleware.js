const { API_BASE_URL, API_SESSION_INITIALISE } = require("../../lib/config");
const { logCoreBackCall, transformError } = require("../shared/loggerHelper");
const { LOG_COMMUNICATION_TYPE_REQUEST } = require("../shared/loggerConstants");
const axios = require("axios");

module.exports = {
  setDebugJourneyType: (req, _res, next) => {
    req.session.isDebugJourney = true;
    next();
  },

  setRealJourneyType: (req, res, next) => {
    req.log.info("starting real journey");
    req.session.isDebugJourney = false;
    next();
  },

  setIpAddress: (req, res, next) => {
    if (req.headers && req.headers["forwarded"]) {
      const ipAddress = req.headers["forwarded"].split(";")[0].split("=")[1];
      req.session.ipAddress = ipAddress || "unknown";
    } else {
      req.session.ipAddress = "unknown";
    }
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

      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_SESSION_INITIALISE,
      });

      const response = await axios.post(
        `${API_BASE_URL}${API_SESSION_INITIALISE}`,
        authParams,
        { headers: { "ip-address": req.session.ipAddress } }
      );

      req.session.ipvSessionId = response?.data?.ipvSessionId;
    } catch (error) {
      transformError(error, `error handling journey page: ${req.params}`);
      return next(error);
    }

    next();
  },
};
