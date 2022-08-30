const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  sendParamsToAPI,
  sendParamsToAPIV2,
  tryHandleRedirectError,
} = require("./middleware");

router.get(
  "/callback",
  tryHandleRedirectError,
  addCallbackParamsToRequest,
  sendParamsToAPI
);

router.get(
  "/callback/:criId",
  tryHandleRedirectError,
  addCallbackParamsToRequest,
  sendParamsToAPIV2
);

module.exports = router;
