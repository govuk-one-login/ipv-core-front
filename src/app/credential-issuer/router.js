
const express = require("express");

const router = express.Router();

const {
  redirectToAuthorize,
  addCallbackParamsToSession,
  renderDebugPage,
} = require("./middleware");

router.get("/authorize", redirectToAuthorize);
router.get("/callback", addCallbackParamsToSession, renderDebugPage);

module.exports = router;
