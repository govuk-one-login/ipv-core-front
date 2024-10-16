const express = require("express");

const healthcheckRouter = express.Router();

healthcheckRouter.get("/", (req, res) => {
  logger.info(`Healthcheck returning 200 OK from ${req.ip}.`);
  return res.status(200).send("OK");
});
healthcheckRouter.get("/docker", (req, res) => {
  logger.info(`Docker Healthcheck returning 200 OK from ${req.ip}.`);
  return res.status(200).send("OK");
});
healthcheckRouter.get("/ecs", (req, res) => {
  logger.info(`ECS Healthcheck returning 200 OK from ${req.ip}.`);
  return res.status(200).send("OK");
});
healthcheckRouter.get("/alb", (req, res) => {
  logger.info(`ALB Healthcheck returning 200 OK from ${req.ip}.`);
  return res.status(200).send("OK");
});
healthcheckRouter.get("/nlb", (req, res) => {
  logger.info(`NLB Healthcheck returning 200 OK from ${req.ip}.`);
  return res.status(200).send("OK");
});

module.exports = healthcheckRouter;
