const { PORT, SESSION_SECRET } = require("./lib/config");
const { setup } = require("hmpo-app");

const loggerConfig = {
  console: true,
  consoleJSON: true,
  app: false,
};

const sessionConfig = {
  cookieName: "service_session",
  secret: SESSION_SECRET,
};

const { router } = setup({
  config: { APP_ROOT: __dirname },
  port: PORT,
  logs: loggerConfig,
  session: sessionConfig,
  urls: {
    public: "/public",
  },
  publicDirs: ["../dist/public"],
  dev: true,
});

router.use("/", require("./app/router"));
router.use("/oauth2", require("./app/oauth2/router"));
router.use("/credential-issuer", require("./app/credential-issuer/router"));
router.use("/debug", require("./app/debug/router"));
