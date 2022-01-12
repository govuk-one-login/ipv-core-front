const { PORT, SESSION_SECRET } = require("./lib/config");
const { setup } = require("hmpo-app");

const loggerConfig = {
  console: true,
  consoleJSON: true,
  app: false,
};

const sessionConfig = {
  cookieName: "ipv_core_service_session",
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

router.use("/oauth2", require("./app/oauth2/router"));
router.use("/credential-issuer-stub", require("./app/credential-issuer-stub/router"));
router.use("/dcs-credential-issuer", require("./app/dcs-credential-issuer/router"));
router.use("/debug", require("./app/debug/router"));
