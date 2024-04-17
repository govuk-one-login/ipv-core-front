const express = require("express");

const router = express.Router();

const { setIpvSessionId, handleOAuthJourneyAction } = require("./middleware");
const path = require("path");

router.get(
  path.join("/", "authorize"),
  setIpvSessionId,
  handleOAuthJourneyAction,
);

module.exports = router;
