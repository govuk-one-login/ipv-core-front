const axios = require("axios");
const { API_BASE_URL, AUTH_PATH } = require("../../lib/config");

module.exports = {
  addAuthParamsToSession: async (req, res, next) => {
    const authParams = {
      response_type: req.query.response_type,
      client_id: req.query.client_id,
      state: req.query.state,
      redirect_uri: req.query.redirect_uri,
    };

    req.session.authParams = authParams;

    next();
  },
  renderOauthPage: async (req, res) => {
    res.render("index-hmpo");
  },

  redirectToDebugPage: async (req, res) => {
    res.redirect("/debug");
  },

  setIpvSessionId: async (req, res, next) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ipv-session`);
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
