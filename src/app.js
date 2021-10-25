const express = require("express");

const createApp = () => {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  return app;
};
module.exports = { createApp };
