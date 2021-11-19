const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  renderOauthPage,
  validatePOST,
} = require("./middleware");

router.get("/authorize", addAuthParamsToSession, renderOauthPage);
router.post("/authorize", validatePOST);

module.exports = router;
