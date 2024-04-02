const express = require("express");

const router = express.Router();

const { setIpvSessionId, setIpAddress } = require("./middleware");

const { handleOAuthJourneyAction } = require("../oauth2/middleware");

router.get(
  "/authorize",
  setIpAddress,
  setIpvSessionId,
  handleOAuthJourneyAction,
);

module.exports = router;
