const express = require("express");
const router = express.Router();

const { authorize } = require("./controllers");

router.get("/authorize", authorize);

module.exports = {
  router,
  mountpath: "/oauth2",
};
