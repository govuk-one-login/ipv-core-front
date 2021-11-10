const { setup } = require("hmpo-app");

const redisConfig = require("./lib/redis")();

const loggerConfig = {
  console: true,
  consoleJSON: true,
  app: false,
};

const sessionConfig = {
  cookieName: "service_session",
  secret: process.env.SESSION_SECRET,
};

const { router } = setup({
  config: { APP_ROOT: __dirname },
  port: process.env.PORT || 3000,
  logs: loggerConfig,
  redis: redisConfig,
  session: sessionConfig,
  urls: {
    public: "/public",
  },
  publicDirs: ["../dist/public"],
  dev: true,
});

router.use("/", require("./app/router"));
router.use("/ipv", require("./app/ipv/router"));
router.use("/passport", require("./app/passport/router"));
