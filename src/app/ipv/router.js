const express = require("express");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const router = express.Router();

const {
  updateJourneyState,
  handleJourneyPage,
  handleJourneyNext,
} = require("./middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

router.get("/page/:pageId", csrfProtection, handleJourneyPage);
router.post("/page/:pageId", parseForm, csrfProtection, handleJourneyNext);
router.get("/*", updateJourneyState);

module.exports = router;
