const express = require("express");

const createApp = () => {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/passport", require("./app/passport/router"));

  return app;
};
module.exports = { createApp };
