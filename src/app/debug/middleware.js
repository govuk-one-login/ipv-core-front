const axios = require("axios");
const { API_BASE_URL, API_REQUEST_CONFIG_PATH } = require("../../lib/config");

module.exports = {
  setCriConfig: async (req, res, next) =>  {
    if (!req.session.criConfig) {
      try {
        const apiResponse = await axios.get(`${API_BASE_URL}${API_REQUEST_CONFIG_PATH}`);
        req.session.criConfig = apiResponse.data;
      } catch (error) {
        res.error = error.name;
        return next(error);
      }
    }
    next();
  },

  renderDebugPage: async (req, res) => {
    res.render("debug/debug");
  },
};
