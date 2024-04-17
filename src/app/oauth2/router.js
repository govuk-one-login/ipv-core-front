const express = require("express");

const router = express.Router();

const {
  setIpvSessionId,
  setIpAddress,
  handleOAuthJourneyAction,
} = require("./middleware");
const path = require("path");

router.get(
  path.join("/", "authorize"),
  setIpAddress,
  setIpvSessionId,
  handleOAuthJourneyAction,
);

module.exports = router;
