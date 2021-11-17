const express = require("express");
const axios = require("axios");

const API_BASE_URL = process.env.API_BASE_URL;
const AUTH_PATH = "/dev/authorize";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/index-hmpo", (req, res) => {
  res.render("index-hmpo");
});

router.get("/authorize", async (req, res) => {
  try {
    const apiResponse = await axios.get(`${API_BASE_URL}${AUTH_PATH}`, {
      params: {
        redirect_uri: "http://example.com",
        client_id: 12345,
        response_type: "code",
        scope: "openid",
      },
    });

    res.status(200).send(apiResponse.data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    res.status(500).send(e.message);
  }
});
module.exports = router;
