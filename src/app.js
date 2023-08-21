require("express");
require("express-async-errors");
const path = require("path");
const session = require("express-session");
const AWS = require("aws-sdk");
const DynamoDBStore = require("connect-dynamodb")(session);

const {
  PORT,
  SESSION_SECRET,
  SESSION_TABLE_NAME,
  CDN_PATH,
  CDN_DOMAIN,
} = require("./lib/config");

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
  journeyEventErrorHandler,
} = require("./handlers/journey-event-error-handler");
const {
  serverErrorHandler,
} = require("./handlers/internal-server-error-handler");
const { pageNotFoundHandler } = require("./handlers/page-not-found-handler");
const {
  securityHeadersHandler,
} = require("./handlers/security-headers-handler");

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
app.use(securityHeadersHandler);

if (CDN_PATH) {
  app.get(["/public"], function (req, res) {
    res.redirect(301, CDN_PATH + req.originalUrl);
  });
} else {
  app.use("/public", express.static(path.join(__dirname, "../dist/public")));
}

if (CDN_DOMAIN) {
  app.get(["/assets"], function (req, res) {
    res.redirect(301, CDN_DOMAIN + req.originalUrl);
  });
} else {
  app.use(
    "/assets",
    express.static(
      path.join(__dirname, "../node_modules/govuk-frontend/govuk/assets")
    )
  );
}

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
      expires: false,
      secret: SESSION_SECRET,
      signed: true,
      secure: "auto",
    },
  })
);

app.use((req, res, next) => {
  if (req.i18n) {
    res.locals.htmlLang = req.i18n.language;
    res.locals.pageTitleLang = req.i18n.language;
    res.locals.mainLang = req.i18n.language;
    next();
  }
});

app.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});

app.use(cookieParser());

app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

app.set("etag", false);

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
router.use("/ipv", require("./app/ipv/router"));

router.get("/healthcheck", (req, res) => {
  return res.status(200).send("OK");
});

app.use(router);

app.use(journeyEventErrorHandler);
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
