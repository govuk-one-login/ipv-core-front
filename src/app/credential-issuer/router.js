const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  sendParamsToAPI,
  sendParamsToAPIV2,
} = require("./middleware");

router.get("/callback", addCallbackParamsToRequest, sendParamsToAPI);

router.get("/callback/:criId", addCallbackParamsToRequest, sendParamsToAPIV2);

module.exports = router;
