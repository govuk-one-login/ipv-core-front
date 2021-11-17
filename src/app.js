require("dotenv").config();

const { setup } = require("hmpo-app");

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
  session: sessionConfig,
  urls: {
    public: "/public",
  },
  publicDirs: ["../dist/public"],
  dev: true,
});

router.use("/", require("./app/router"));
