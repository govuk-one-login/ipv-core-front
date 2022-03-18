const axios = require("axios");
const { API_BASE_URL, AUTH_PATH } = require("../../lib/config");

module.exports = {
  renderOauthPage: async (req, res) => {
    res.render("index-hmpo");
  },

  redirectToDebugPage: async (req, res) => {
    res.redirect("/debug");
  },

  redirectToJourney: async (req, res) => {
    res.redirect("/journey/next");
  },

  setIpvSessionId: async (req, res, next) => {
    try {
      const authParams = {
        responseType: req.query.response_type,
        clientId: req.query.client_id,
        redirectUri: req.query.redirect_uri,
        state: req.query.state,
        scope: req.query.scope
      };

      const response = await axios.post(`${API_BASE_URL}/session/start`, authParams);
      req.session.ipvSessionId = response?.data?.ipvSessionId;
    } catch (error) {
      res.error = error.name;
      return next(error);
    }

    next();
  },

  retrieveAuthorizationCode: async (req, res, next) => {
    try {
      const oauthParams = {
        ...req.session.authParams,
        scope: "openid",
      };

      const apiResponse = await axios.get(`${API_BASE_URL}${AUTH_PATH}`, {
        params: oauthParams,
        headers: { "ipv-session-id": req.session.ipvSessionId },
      });

      const code = apiResponse?.data?.code?.value;

      if (!code) {
        res.status(500);
        return res.send("Missing authorization code");
      }

      req.authorization_code = code;

      next();
    } catch (e) {
      next(e);
    }
  },

  redirectToCallback: async (req, res) => {
    const redirectURL = `${req.session.authParams.redirect_uri}?code=${req.authorization_code}`;

    res.redirect(redirectURL);
  },
};
