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
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const { getCSRFCookieOptions } = require("./config/cookie");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const { i18nextConfigurationOptions } = require("./config/i18next");

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

const sessionConfig = {
  cookieName: "ipv_core_service_session",
  secret: SESSION_SECRET,
  sessionStore: sessionStore,
};

const app = express();

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(loggerMiddleware);
app.use(
  "/assets",
  express.static(path.resolve("node_modules/govuk-frontend/govuk/assets"))
);

app.use("/public", express.static(path.join(__dirname, "../dist/public")));

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
      secure: true,
    },
  })
);

app.use(cookieParser());
app.use(csurf({ cookie: getCSRFCookieOptions(true) }));

const router = express.Router();

router.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});

router.get("/", (req, res, next) => {
  return res.render(`ipv/page-pre-kbv-transition.njk`);
});

router.use(getGTM);
router.use("/oauth2", require("./app/oauth2/router"));
router.use("/credential-issuer", require("./app/credential-issuer/router"));
router.use("/debug", require("./app/debug/router"));
router.use("/ipv", require("./app/ipv/router"));

app.use(router);

const port = 3000;
app
  .listen(port, () => {
    logger.info(`Server listening on port ${port}`);
    app.emit("appStarted");
  })
  .on("error", (error) => {
    logger.error(`Unable to start server because of ${error.message}`);
  });

// const { router } = setup({
//   config: { APP_ROOT: __dirname },
//   port: PORT,
//   logs: { console: false, consoleJSON: false, app: false },
//   session: sessionConfig,
//   redis: !sessionStore,
//   urls: {
//     public: "/public",
//   },
//   publicDirs: ["../dist/public"],
//   translation: {
//     allowedLangs: ["en", "cy"],
//     fallbackLang: ["en"],
//     cookie: { name: "lng" },
//   },
//   dev: true,
//   middlewareSetupFn: (app) => {
//     app.use(function (req, res, next) {
//       req.headers["x-forwarded-proto"] = "https";
//       next();
//     });
//     app.use(loggerMiddleware);
//   },
// });

// router.use((req, res, next) => {
//   req.log = logger.child({
//     requestId: req.id,
//     ipvSessionId: req.session?.ipvSessionId,
//     sessionId: req.session?.id,
//   });
//   next();
// });
//
// router.use(getGTM);
// router.use("/oauth2", require("./app/oauth2/router"));
// router.use("/credential-issuer", require("./app/credential-issuer/router"));
// router.use("/debug", require("./app/debug/router"));
// router.use("/ipv", require("./app/ipv/router"));
