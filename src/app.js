require("express");
require("express-async-errors");
const session = require("express-session");
const AWS = require("aws-sdk");
const DynamoDBStore = require("connect-dynamodb")(session);

const { PORT, SESSION_SECRET, SESSION_TABLE_NAME } = require("./lib/config");
const { setup } = require("hmpo-app");
const { getGTM } = require("./lib/locals");
const { loggerMiddleware, logger } = require("./lib/logger");

let sessionStore;

if (process.env.NODE_ENV !== "local") {
  AWS.config.update({
    region: "eu-west-2",
  });
  const dynamodb = new AWS.DynamoDB();

  sessionStore = new DynamoDBStore({
    client: dynamodb,
    table: SESSION_TABLE_NAME,
  });
}

const sessionConfig = {
  cookieName: "ipv_core_service_session",
  secret: SESSION_SECRET,
  sessionStore: sessionStore,
};

const { router } = setup({
  config: { APP_ROOT: __dirname },
  port: PORT,
  logs: { console: false, consoleJSON: false, app: false },
  session: sessionConfig,
  redis: !sessionStore,
  urls: {
    public: "/public",
  },
  publicDirs: ["../dist/public"],
  translation: {
    allowedLangs: ["en", "cy"],
    fallbackLang: ["en"],
    cookie: { name: "lng" },
  },
  dev: true,
  middlewareSetupFn: (app) => {
    app.use(function (req, res, next) {
      req.headers["x-forwarded-proto"] = "https";
      next();
    });
    app.use(loggerMiddleware);
  },
});

router.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});

router.use(getGTM);
router.use("/oauth2", require("./app/oauth2/router"));
router.use("/credential-issuer", require("./app/credential-issuer/router"));
router.use("/debug", require("./app/debug/router"));
router.use("/ipv", require("./app/ipv/router"));
