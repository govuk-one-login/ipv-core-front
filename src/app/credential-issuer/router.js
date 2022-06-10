const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  sendParamsToAPI,
  tryHandleRedirectError
} = require("./middleware");

router.get(
  "/callback",
  tryHandleRedirectError,
  addCallbackParamsToRequest,
  sendParamsToAPI
);

module.exports = router;
