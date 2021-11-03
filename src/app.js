const express = require("express");
const initialiseRoutes = require("./routes");
const createApp = () => {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  initialiseRoutes(app);

  return app;
};
module.exports = { createApp };
