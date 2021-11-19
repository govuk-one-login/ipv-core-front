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
      ...req.session.authParams,
      scope: "openid",
    };

    const apiResponse = await axios.get(`${API_BASE_URL}${AUTH_PATH}`, {
      params: oauthParams,
    });

    const code = apiResponse.data?.code?.value;

    if (!code) {
      res.status(500).send("Missing authorization code");
    }

    const redirectURL = `${req.session.authParams.redirect_uri}?code=${code}`;

    res.redirect(redirectURL);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    res.status(500).send(e.message);
  }
});
module.exports = router;
