const { API_BASE_URL, AUTH_PATH } = require("../../lib/config");
const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/authorize", (req, res) => {
  const authParams = {
    response_type: req.query.response_type,
    client_id: req.query.client_id,
    state: req.query.state,
    redirect_uri: req.query.redirect_uri,
  };

  req.session.authParams = authParams;

  res.render("index-hmpo");
});

router.get("/index-hmpo", (req, res) => {
  res.render("index-hmpo");
});

router.post("/authorize", async (req, res) => {
  try {
    const oauthParams = {
      redirect_uri: req.session.authParams.redirect_uri,
      client_id: req.session.authParams.client_id,
      response_type: req.session.authParams.response_type,
      scope: "openid",
    };

    const apiResponse = await axios.get(`${API_BASE_URL}${AUTH_PATH}`, {
      validateStatus: (status) => {
        return status === 302;
      },
      maxRedirects: 0,
      params: oauthParams,
    });

    const redirectURL = apiResponse.headers?.location;

    if (!redirectURL) {
      res.status(500).send("Missing redirect url");
    }

    return res.redirect(redirectURL);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    res.status(500).send(e.message);
  }
});
module.exports = router;
