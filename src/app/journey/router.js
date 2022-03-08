const express = require("express");

const router = express.Router();

const { updateJourneyState } = require("./middleware");

router.get("/", updateJourneyState);

module.exports = router;
