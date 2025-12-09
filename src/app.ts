// Must be imported before any route definitions to correctly patch express
import path from "path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import connect from "connect-dynamodb";
import cookieParser from "cookie-parser";
import express from "express";
import session, { Store as SessionStore } from "express-session";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import uid from "uid-safe";
import { frontendVitalSignsInit } from "@govuk-one-login/frontend-vital-signs";
import criRouter from "./app/credential-issuer/router";
import devRouter from "./app/development/router";
import ipvRouter from "./app/ipv/router";
import mobileAppRouter from "./app/mobile-app/router";
import vcReceiptStatusRouter from "./app/vc-receipt-status/router";
import wellKnownRouter from "./app/./.well-known/router";
import oauthRouter from "./app/oauth2/router";
import config from "./config/config";
import { setLocals } from "./lib/locals";
import { loggerMiddleware, logger } from "./lib/logger";
import { i18nextConfigurationOptions } from "./config/i18next";
import serverErrorHandler from "./handlers/internal-server-error-handler";
import journeyEventErrorHandler from "./handlers/journey-event-error-handler";
import unknownRouteHandler from "./handlers/unknown-route-handler";
import {
  securityHeadersHandler,
  cspHandler,
} from "./handlers/security-headers-handler";
import protect, { ProtectionConfig } from "overload-protection";
import { configureNunjucks, VIEWS } from "./config/nunjucks";
import notificationBannerHandler from "./handlers/notification-banner-handler";
import {
  setBaseTranslations,
  setFrontendUiTranslations,
  frontendUiMiddleware,
} from "@govuk-one-login/frontend-ui";

// Extend request object with our own extensions
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      generatedSessionId?: string;
    }
  }
}

// Extend session object with properties we expect
declare module "express-session" {
  interface SessionData {
    ipvSessionId?: string;
    clientOauthSessionId?: string;
    currentPage?: string;
    history?: string[];
    context?: string;
    featureSet?: string;
    ipAddress?: string;
    currentPageStatusCode?: number;
    journey?: string;
  }
}

const DynamoDBStore = connect(session);

const APP_VIEWS = [...VIEWS, path.resolve("dist/public/html/")];

const sessionStore: SessionStore | undefined =
  process.env.NODE_ENV !== "local"
    ? new DynamoDBStore({
        client: new DynamoDBClient({ region: "eu-west-2" }),
        table: config.SESSION_TABLE_NAME,
      })
    : undefined;

const app = express();

const protectConfig: ProtectionConfig = {
  production: process.env.NODE_ENV === "production",
  clientRetrySecs: 1,
  sampleInterval: 5,
  maxEventLoopDelay: 700,
  maxHeapUsedBytes: 0,
  maxRssBytes: 0,
  errorPropagationMode: true,
  logging: (msg) => {
    logger.error(msg);
  },
};
const overloadProtection = protect("express", protectConfig);
app.use(overloadProtection);

app.enable("trust proxy");
app.use(function (req, res, next) {
  req.headers["x-forwarded-proto"] = "https";
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(securityHeadersHandler);

app.use("/public", express.static(path.resolve("dist/public")));
app.use(
  "/assets",
  express.static(
    path.resolve("node_modules/govuk-frontend/dist/govuk/assets"),
    { maxAge: "3600s" },
  ),
);

app.get("/healthcheck", (req, res) => {
  logger.debug("Healthcheck returning 200 OK.");
  res.status(200).send("OK");
});

app.use(setLocals);
app.use(cspHandler);
app.set(
  "view engine",
  configureNunjucks(
    { express: app, noCache: !config.TEMPLATE_CACHING },
    APP_VIEWS,
  ),
);

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init(
    i18nextConfigurationOptions(path.resolve("locales/{{lng}}/{{ns}}.json")),
  );

setBaseTranslations(i18next);
setFrontendUiTranslations(i18next);
app.use(i18nextMiddleware.handle(i18next));
app.use(frontendUiMiddleware);

app.use(cookieParser());

// Generate a new session ID asynchronously if no session cookie
// `express-session` does not support async session ID generation
// https://github.com/expressjs/session/issues/107
app.use(async (req, res, next) => {
  if (!req.cookies[config.SESSION_COOKIE_NAME]) {
    req.generatedSessionId = await uid(24);
  }
  next();
});

app.use(
  session({
    name: config.SESSION_COOKIE_NAME,
    store: sessionStore,
    saveUninitialized: false,
    secret: config.SESSION_SECRET,
    unset: "destroy",
    resave: false,
    cookie: {
      expires: undefined,
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
    res.locals.showLanguageToggle = config.LANGUAGE_TOGGLE_ENABLED;
    res.locals.useDeviceIntelligence = config.USE_DEVICE_INTELLIGENCE;
    res.locals.currentLanguage = req.i18n.language;

    // currentUrl is required by the language toggle component
    res.locals.currentUrl = new URL(
      req.protocol + "://" + req.get("host") + req.originalUrl,
    );
    next();
  }
});

app.use(notificationBannerHandler);

app.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    ipvSessionId: req.session?.ipvSessionId,
    sessionId: req.session?.id,
  });
  next();
});
app.use(loggerMiddleware);

app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0",
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

router.use("/oauth2", oauthRouter);
router.use("/credential-issuer", criRouter);
router.use("/app", mobileAppRouter);
router.use("/ipv", ipvRouter);
router.use("/app-vc-receipt-status", vcReceiptStatusRouter);
if (config.ENABLE_PREVIEW) {
  router.use("/dev", devRouter);
}
app.use("/.well-known", wellKnownRouter);

app.use(router);

app.use(journeyEventErrorHandler);
app.use(serverErrorHandler);
app.use(unknownRouteHandler);

const server = app
  .listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`);
    app.emit("appStarted");
  })
  .on("error", (error) => {
    logger.error(`Unable to start server because of ${error.message}`);
  });

if (process.env.NODE_ENV !== "local") {
  frontendVitalSignsInit(server, {
    staticPaths: [/^\/assets\/.*/, /^\/public\/.*/],
  });
}

// AWS recommends the keep-alive duration of the target is longer than the idle timeout value of the load balancer (default 60s)
// to prevent possible 502 errors where the target connection has already been closed
// https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html#http-502-issues
server.keepAliveTimeout = 65000;

process.on("SIGTERM", () => {
  logger.debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.debug("HTTP server closed");
  });
});

export default app;
