const express = require("express");

const router = express.Router();

const { setIpvSessionId, setIpAddress, handleOAuthJourneyAction } = require("./middleware");


router.get(
  "/authorize",
  setIpAddress,
  setIpvSessionId,
  handleOAuthJourneyAction,
);

module.exports = router;
