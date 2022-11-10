require("express");
require("express-async-errors");
const path = require("path");
const session = require("express-session");
const AWS = require("aws-sdk");
const DynamoDBStore = require("connect-dynamodb")(session);

const { PORT, SESSION_SECRET, SESSION_TABLE_NAME } = require("./lib/config");

const { getGTM } = require("./lib/locals");
const { loggerMiddleware, logger } = require("./lib/logger");
const express = require("express");
const { configureNunjucks } = require("./config/nunjucks");

const cookieParser = require("cookie-parser");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const { i18nextConfigurationOptions } = require("./config/i18next");
const {
  serverErrorHandler,
} = require("./handlers/internal-server-error-handler");
const { pageNotFoundHandler } = require("./handlers/page-not-found-handler");

const APP_VIEWS = [
  path.join(__dirname, "views"),
  path.resolve("node_modules/govuk-frontend/"),
];

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

const app = express();

app.enable("trust proxy");
app.use(function (req, res, next) {
  req.headers["x-forwarded-proto"] = "https";
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  "/assets",
  express.static(
    path.join(__dirname, "../node_modules/govuk-frontend/govuk/assets")
  )
);
app.use("/public", express.static(path.join(__dirname, "../dist/public")));

app.use(loggerMiddleware);

app.set("view engine", configureNunjucks(app, APP_VIEWS));

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init(
    i18nextConfigurationOptions(
      path.join(__dirname, "locales/{{lng}}/{{ns}}.json")
    )
  );

app.use(i18nextMiddleware.handle(i18next));

app.use(
  session({
    name: "ipv_core_service_session",
    store: sessionStore,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    unset: "destroy",
    resave: false,
    cookie: {
      name: "ipv_core_service_session",
      maxAge: 720000,
      secret: SESSION_SECRET,
      signed: true,
      secure: "auto",
    },
  })
);

app.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});

app.use(cookieParser());

const router = express.Router();

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

router.get("/healthcheck", (req, res) => {
  return res.status(200).send("OK");
});

app.use(router);

app.use(serverErrorHandler);
app.use(pageNotFoundHandler);

app
  .listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
    app.emit("appStarted");
  })
  .on("error", (error) => {
    logger.error(`Unable to start server because of ${error.message}`);
  });

module.exports = app;
