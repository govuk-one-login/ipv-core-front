require("express");
require("express-async-errors");

const path = require("path");
const session = require("express-session");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const DynamoDBStore = require("connect-dynamodb")(session);
const uid = require("uid-safe");
const {
  frontendVitalSignsInit,
} = require("@govuk-one-login/frontend-vital-signs");

const {
  PORT,
  SESSION_SECRET,
  SESSION_TABLE_NAME,
  ENABLE_PREVIEW,
  LANGUAGE_TOGGLE_ENABLED,
  SESSION_COOKIE_NAME,
} = require("./lib/config");

const { setLocals } = require("./lib/locals");

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
  cspHandler,
} = require("./handlers/security-headers-handler");

const APP_VIEWS = [
  path.join(__dirname, "views"),
  path.resolve("node_modules/govuk-frontend/"),
  path.resolve("node_modules/@govuk-one-login/"),
];

let sessionStore;

if (process.env.NODE_ENV !== "local") {
  const dynamodb = new DynamoDBClient({
    region: "eu-west-2"
  });

  sessionStore = new DynamoDBStore({
    client: dynamodb,
    table: SESSION_TABLE_NAME,
  });
}

const app = express();

const protectCfg = {
  production: process.env.NODE_ENV === 'production', // if production is false, detailed error messages are exposed to the client
  clientRetrySecs: 1, // Retry-After header, in seconds (0 to disable) [default 1]
  sampleInterval: 5, // sample rate, milliseconds [default 5]
  maxEventLoopDelay: 100, // maximum detected delay between event loop ticks [default 42]
  maxHeapUsedBytes: 0, // maximum heap used threshold (0 to disable) [default 0]
  maxRssBytes: 0, // maximum rss size threshold (0 to disable) [default 0]
  errorPropagationMode: false, // dictate behavior: take over the response
                              // or propagate an error to the framework [default false]
  logging: false, // set to string for log level or function to pass data to
  logStatsOnReq: false // set to true to log stats on every requests
}

const protect = require('overload-protection')('express', protectCfg)
app.use(protect)

app.enable("trust proxy");
app.use(function (req, res, next) {
  req.headers["x-forwarded-proto"] = "https";
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(securityHeadersHandler);

app.use("/public", express.static(path.join(__dirname, "../dist/public")));
app.use(
  "/assets",
  express.static(
    path.join(__dirname, "../node_modules/govuk-frontend/govuk/assets"),
  ),
);

app.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});

const healthcheckRouter = express.Router();
healthcheckRouter.get("/healthcheck", (req, res) => {
  logger.info(`Healthcheck returning 200 OK.`);
  return res.status(200).send("OK");
});

app.use(healthcheckRouter);

app.use(setLocals);
app.use(cspHandler);
app.set("view engine", configureNunjucks(app, APP_VIEWS));

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init(
    i18nextConfigurationOptions(
      path.join(__dirname, "locales/{{lng}}/{{ns}}.json"),
    ),
  );

app.use(i18nextMiddleware.handle(i18next));

app.use(cookieParser());

// Generate a new session ID asynchronously if no session cookie
// `express-session` does not support sync session ID generation
// https://github.com/expressjs/session/issues/107
app.use(async (req, res, next) => {
  if (!req.cookies[SESSION_COOKIE_NAME]) {
    req.generatedSessionId = await uid(24);
  }
  next();
});

app.use(
  session({
    name: SESSION_COOKIE_NAME,
    store: sessionStore,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    unset: "destroy",
    resave: false,
    cookie: {
      name: SESSION_COOKIE_NAME,
      expires: false,
      secret: SESSION_SECRET,
      signed: true,
      secure: "auto",
    },
    // Use the newly generated session ID, or fall back to the default behaviour
    genid: (req) => {
      const sessionId = req.generatedSessionId || uid.sync(24);
      delete req.generatedSessionId;
      return sessionId;
    },
  }),
);

app.use((req, res, next) => {
  if (req.i18n) {
    res.locals.showLanguageToggle = LANGUAGE_TOGGLE_ENABLED;
    res.locals.currentLanguage = req.i18n.language;

    // currentUrl is required by the language toggle component
    res.locals.currentUrl = new URL(
      req.protocol + "://" + req.get("host") + req.originalUrl,
    );
    next();
  }
});

app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0",
  );
  next();
});

app.set("etag", false);

const router = express.Router();
router.use(loggerMiddleware);

router.use("/oauth2", require("./app/oauth2/router"));
router.use("/credential-issuer", require("./app/credential-issuer/router"));
router.use("/ipv", require("./app/ipv/router"));
if (ENABLE_PREVIEW) {
  router.use("/dev", require("./app/development/router"));
}

app.use(router);

app.use(journeyEventErrorHandler);
app.use(serverErrorHandler);
app.use(pageNotFoundHandler);

const server = app
  .listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
    app.emit("appStarted");
  })
  .on("error", (error) => {
    logger.error(`Unable to start server because of ${error.message}`);
  });

// AWS recommends the keep-alive duration of the target is longer than the idle timeout value of the load balancer (default 60s)
// to prevent possible 502 errors where the target connection has already been closed
// https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html#http-502-issues

// The idle timeout of the NLB is 350 seconds, so this is going to be configured to be greater than that too.
// The NLB is hardcoded - so 350 seconds.
// The ALB is configurable - so 355 seconds.
// This server is now configured to 360 seconds.
server.keepAliveTimeout = 360000;

frontendVitalSignsInit(server, {
  interval: 10000,
  logLevel: "info",
  staticPaths: ["/fonts", "/images", "/javascripts", "/stylesheets"],
});

process.on('SIGTERM', () => {
  logger.debug('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    logger.debug('HTTP server closed')
  })
})

module.exports = app;
